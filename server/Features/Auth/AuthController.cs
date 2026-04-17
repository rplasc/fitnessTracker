using System.Security.Claims;
using FitTrack.Api.Data;
using FitTrack.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Auth;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(AppDbContext db, ILogger<AuthController> logger) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 50)
            return Problem(statusCode: 400, title: "Username must be between 1 and 50 characters");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return Problem(statusCode: 400, title: "Password must be at least 8 characters");

        var usernameTrimmed = request.Username.Trim();

        var exists = await db.Users.AnyAsync(u => u.Username == usernameTrimmed);
        if (exists)
            return Problem(statusCode: 409, title: "Username already taken");

        var user = new User
        {
            Username = usernameTrimmed,
            PasswordHash = PasswordHelper.Hash(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        await SignInUser(user);
        logger.LogInformation("User {UserId} registered", user.Id);
        return StatusCode(201, new { user.Id, user.Username });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user is null || !PasswordHelper.Verify(request.Password, user.PasswordHash))
        {
            logger.LogWarning("Failed login attempt for username: {Username}", request.Username);
            return Problem(statusCode: 401, title: "Invalid username or password");
        }

        await SignInUser(user);
        logger.LogInformation("User {UserId} logged in", user.Id);
        return NoContent();
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var isAuthenticated = User.Identity?.IsAuthenticated == true;
        string? username = null;
        string? displayName = null;
        var weightUnit = "kg";
        var heightUnit = "cm";
        var onboardingComplete = false;

        if (isAuthenticated)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            username = User.FindFirstValue(ClaimTypes.Name);
            var user = await db.Users.FindAsync(userId);
            displayName = user?.DisplayName;
            var setting = await db.Settings.FirstOrDefaultAsync(s => s.UserId == userId);
            weightUnit = setting?.WeightUnit ?? "kg";
            heightUnit = setting?.HeightUnit ?? "cm";
            onboardingComplete = setting?.OnboardingComplete ?? false;
        }

        return Ok(new MeResponse(isAuthenticated, username, weightUnit, onboardingComplete, displayName, heightUnit));
    }

    [Authorize]
    [HttpPost("complete-onboarding")]
    public async Task<IActionResult> CompleteOnboarding([FromBody] CompleteOnboardingRequest request)
    {
        if (request.DisplayName.Length > 100)
            return Problem(statusCode: 400, title: "Display name must be 100 characters or less");

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Update display name (empty string = skip, keep null)
        var user = await db.Users.FindAsync(userId);
        if (user is null) return Problem(statusCode: 404, title: "User not found");
        if (!string.IsNullOrWhiteSpace(request.DisplayName))
            user.DisplayName = request.DisplayName.Trim();

        // Upsert Setting (creates if missing, like GetOrCreateAsync)
        var setting = await db.Settings.FirstOrDefaultAsync(s => s.UserId == userId);
        if (setting is null)
        {
            setting = new Setting { UserId = userId, WeightUnit = "kg" };
            db.Settings.Add(setting);
        }
        if (request.HeightCm.HasValue) setting.HeightCm = request.HeightCm;
        setting.OnboardingComplete = true;

        // Log initial body weight if provided
        if (request.InitialWeightKg.HasValue && request.InitialWeightKg > 0)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var existingMetric = await db.HealthMetrics
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Date == today);
            if (existingMetric is null)
            {
                db.HealthMetrics.Add(new HealthMetric
                {
                    UserId = userId,
                    Date = today,
                    BodyWeight = (double)request.InitialWeightKg.Value,
                    LoggedAt = DateTime.UtcNow
                });
            }
        }

        // Create initial plan if a name was provided
        if (!string.IsNullOrWhiteSpace(request.PlanName))
        {
            db.Plans.Add(new Plan
            {
                UserId = userId,
                Name = request.PlanName.Trim(),
                Color = request.PlanColor
            });
        }

        await db.SaveChangesAsync();
        logger.LogInformation("User {UserId} completed onboarding", userId);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("data")]
    public async Task<IActionResult> ResetData()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var sessions = db.WorkoutSessions.Where(s => s.UserId == userId);
        db.WorkoutSessions.RemoveRange(sessions);

        var metrics = db.HealthMetrics.Where(m => m.UserId == userId);
        db.HealthMetrics.RemoveRange(metrics);

        var plans = db.Plans.Where(p => p.UserId == userId);
        db.Plans.RemoveRange(plans);

        var schedules = db.Schedules.Where(s => s.UserId == userId);
        db.Schedules.RemoveRange(schedules);

        await db.SaveChangesAsync();
        logger.LogInformation("User {UserId} reset all data", userId);
        return NoContent();
    }

    private async Task SignInUser(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username)
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var props = new AuthenticationProperties { IsPersistent = true };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, props);
    }
}

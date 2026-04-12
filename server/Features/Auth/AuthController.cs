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
        var weightUnit = "kg";

        if (isAuthenticated)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            username = User.FindFirstValue(ClaimTypes.Name);
            var setting = await db.Settings.FirstOrDefaultAsync(s => s.UserId == userId);
            weightUnit = setting?.WeightUnit ?? "kg";
        }

        return Ok(new MeResponse(isAuthenticated, username, weightUnit));
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
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
    }
}

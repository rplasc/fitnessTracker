using System.Security.Claims;
using FitTrack.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Auth;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IConfiguration config, AppDbContext db, ILogger<AuthController> logger) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var expected = config["FitTrack:Passcode"];
        if (string.IsNullOrEmpty(expected) || request.Passcode != expected)
        {
            logger.LogWarning("Failed login attempt");
            return Problem(statusCode: 401, title: "Invalid passcode");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "local-user"),
            new(ClaimTypes.Name, "FitTrack")
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        logger.LogInformation("Login successful");
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
        var weightUnit = "kg";

        if (isAuthenticated)
        {
            var setting = await db.Settings.FirstOrDefaultAsync();
            weightUnit = setting?.WeightUnit ?? "kg";
        }

        return Ok(new MeResponse(isAuthenticated, weightUnit));
    }
}

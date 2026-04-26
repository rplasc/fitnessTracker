using System.Security.Claims;
using FitTrack.Api.Data;
using FitTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Settings;

[ApiController]
[Route("api/v1/settings")]
[Authorize]
public class SettingsController(AppDbContext db) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = GetUserId();
        var setting = await GetOrCreateAsync(userId);
        return Ok(new SettingsResponse(setting.WeightUnit, setting.HeightUnit, setting.HeightCm, setting.RestSeconds));
    }

    [HttpPatch]
    public async Task<IActionResult> Patch([FromBody] PatchSettingsRequest request)
    {
        if (request.WeightUnit is not null && request.WeightUnit != "kg" && request.WeightUnit != "lb")
            return Problem(statusCode: 400, title: "Weight unit must be 'kg' or 'lb'");

        if (request.HeightUnit is not null && request.HeightUnit != "cm" && request.HeightUnit != "in")
            return Problem(statusCode: 400, title: "Height unit must be 'cm' or 'in'");

        if (request.RestSeconds is not null && (request.RestSeconds < 15 || request.RestSeconds > 600))
            return Problem(statusCode: 400, title: "Rest seconds must be between 15 and 600");

        var userId = GetUserId();
        var setting = await GetOrCreateAsync(userId);

        if (request.WeightUnit is not null)
            setting.WeightUnit = request.WeightUnit;
        if (request.HeightUnit is not null)
            setting.HeightUnit = request.HeightUnit;
        if (request.HeightCm.HasValue)
            setting.HeightCm = request.HeightCm;
        if (request.RestSeconds is not null)
            setting.RestSeconds = request.RestSeconds.Value;

        await db.SaveChangesAsync();
        return Ok(new SettingsResponse(setting.WeightUnit, setting.HeightUnit, setting.HeightCm, setting.RestSeconds));
    }

    private async Task<Setting> GetOrCreateAsync(int userId)
    {
        var setting = await db.Settings.FirstOrDefaultAsync(s => s.UserId == userId);
        if (setting is null)
        {
            setting = new Setting { UserId = userId, WeightUnit = "kg" };
            db.Settings.Add(setting);
            await db.SaveChangesAsync();
        }
        return setting;
    }
}

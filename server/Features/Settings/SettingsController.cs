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
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var setting = await GetOrCreateAsync();
        return Ok(new SettingsResponse(setting.WeightUnit));
    }

    [HttpPatch]
    public async Task<IActionResult> Patch([FromBody] PatchSettingsRequest request)
    {
        if (request.WeightUnit is not null && request.WeightUnit != "kg" && request.WeightUnit != "lb")
            return Problem(statusCode: 400, title: "Weight unit must be 'kg' or 'lb'");

        var setting = await GetOrCreateAsync();

        if (request.WeightUnit is not null)
            setting.WeightUnit = request.WeightUnit;

        await db.SaveChangesAsync();
        return Ok(new SettingsResponse(setting.WeightUnit));
    }

    private async Task<Setting> GetOrCreateAsync()
    {
        var setting = await db.Settings.FirstOrDefaultAsync();
        if (setting is null)
        {
            setting = new Setting { WeightUnit = "kg" };
            db.Settings.Add(setting);
            await db.SaveChangesAsync();
        }
        return setting;
    }
}

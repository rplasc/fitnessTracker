using System.Security.Claims;
using System.Text.Json;
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
        return Ok(new SettingsResponse(
            setting.WeightUnit,
            setting.HeightUnit,
            setting.HeightCm,
            setting.RestSeconds,
            setting.WeeklyWorkoutGoal,
            setting.TargetWeightKg));
    }

    [HttpPatch]
    public async Task<IActionResult> Patch([FromBody] JsonElement request)
    {
        string? weightUnit = null;
        string? heightUnit = null;
        decimal? heightCm = null;
        int? restSeconds = null;
        int? weeklyWorkoutGoal = null;
        decimal? targetWeightKg = null;

        var hasWeightUnit = TryGetString(request, "weightUnit", out weightUnit);
        var hasHeightUnit = TryGetString(request, "heightUnit", out heightUnit);
        var hasHeightCm = TryGetDecimal(request, "heightCm", out heightCm);
        var hasRestSeconds = TryGetInt(request, "restSeconds", out restSeconds);
        var hasWeeklyWorkoutGoal = TryGetInt(request, "weeklyWorkoutGoal", out weeklyWorkoutGoal);
        var hasTargetWeightKg = TryGetDecimal(request, "targetWeightKg", out targetWeightKg);

        if (hasWeightUnit && weightUnit is not null && weightUnit != "kg" && weightUnit != "lb")
            return Problem(statusCode: 400, title: "Weight unit must be 'kg' or 'lb'");

        if (hasHeightUnit && heightUnit is not null && heightUnit != "cm" && heightUnit != "in")
            return Problem(statusCode: 400, title: "Height unit must be 'cm' or 'in'");

        if (hasRestSeconds && restSeconds is not null && (restSeconds < 15 || restSeconds > 600))
            return Problem(statusCode: 400, title: "Rest seconds must be between 15 and 600");

        if (hasWeeklyWorkoutGoal && weeklyWorkoutGoal is not null && (weeklyWorkoutGoal < 1 || weeklyWorkoutGoal > 14))
            return Problem(statusCode: 400, title: "Weekly workout goal must be between 1 and 14");

        if (hasTargetWeightKg && targetWeightKg is not null && targetWeightKg <= 0)
            return Problem(statusCode: 400, title: "Target weight must be greater than 0");

        var userId = GetUserId();
        var setting = await GetOrCreateAsync(userId);

        if (hasWeightUnit && weightUnit is not null)
            setting.WeightUnit = weightUnit;
        if (hasHeightUnit && heightUnit is not null)
            setting.HeightUnit = heightUnit;
        if (hasHeightCm)
            setting.HeightCm = heightCm;
        if (hasRestSeconds && restSeconds is not null)
            setting.RestSeconds = restSeconds.Value;
        if (hasWeeklyWorkoutGoal)
            setting.WeeklyWorkoutGoal = weeklyWorkoutGoal;
        if (hasTargetWeightKg)
            setting.TargetWeightKg = targetWeightKg;

        await db.SaveChangesAsync();
        return Ok(new SettingsResponse(
            setting.WeightUnit,
            setting.HeightUnit,
            setting.HeightCm,
            setting.RestSeconds,
            setting.WeeklyWorkoutGoal,
            setting.TargetWeightKg));
    }

    private static bool TryGetString(JsonElement root, string propertyName, out string? value)
    {
        value = null;
        if (!root.TryGetProperty(propertyName, out var property))
            return false;

        if (property.ValueKind == JsonValueKind.Null)
            return true;

        value = property.GetString();
        return true;
    }

    private static bool TryGetInt(JsonElement root, string propertyName, out int? value)
    {
        value = null;
        if (!root.TryGetProperty(propertyName, out var property))
            return false;

        if (property.ValueKind == JsonValueKind.Null)
            return true;

        if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var parsed))
        {
            value = parsed;
            return true;
        }

        throw new JsonException($"Property '{propertyName}' must be an integer or null.");
    }

    private static bool TryGetDecimal(JsonElement root, string propertyName, out decimal? value)
    {
        value = null;
        if (!root.TryGetProperty(propertyName, out var property))
            return false;

        if (property.ValueKind == JsonValueKind.Null)
            return true;

        if (property.ValueKind == JsonValueKind.Number && property.TryGetDecimal(out var parsed))
        {
            value = parsed;
            return true;
        }

        throw new JsonException($"Property '{propertyName}' must be a number or null.");
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

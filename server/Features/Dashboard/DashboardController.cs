using System.Globalization;
using System.Security.Claims;
using FitTrack.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Dashboard;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = GetUserId();
        var todayPlan = await GetTodayPlanAsync(userId);
        var lastWorkout = await GetLastWorkoutAsync(userId);
        var currentWeight = await GetCurrentWeightAsync(userId);

        return Ok(new DashboardResponse(todayPlan, lastWorkout, currentWeight));
    }

    private async Task<DashboardTodayPlan?> GetTodayPlanAsync(int userId)
    {
        var dayOfWeek = (int)DateTime.UtcNow.DayOfWeek;

        var schedule = await db.Schedules
            .Include(s => s.Plan)
            .ThenInclude(p => p!.Exercises.OrderBy(pe => pe.OrderIndex))
            .ThenInclude(pe => pe.Exercise)
            .FirstOrDefaultAsync(s => s.DayOfWeek == dayOfWeek && s.UserId == userId);

        if (schedule?.Plan is null)
            return null;

        var exercises = schedule.Plan.Exercises
            .Select(pe => new DashboardTodayPlanExercise(pe.Exercise.Name, pe.Sets, pe.Reps))
            .ToList();

        return new DashboardTodayPlan(schedule.Plan.Id, schedule.Plan.Name, schedule.Plan.Color, exercises);
    }

    private async Task<DashboardLastWorkout?> GetLastWorkoutAsync(int userId)
    {
        var session = await db.WorkoutSessions
            .Where(s => s.FinishedAt != null && s.UserId == userId)
            .Include(s => s.Sets)
            .ThenInclude(ws => ws.Exercise)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        if (session is null)
            return null;

        var exerciseGroups = session.Sets
            .GroupBy(ws => ws.Exercise.Name)
            .Select(g => new DashboardLastWorkoutExercise(
                g.Key,
                g.OrderBy(ws => ws.SetNumber)
                 .Select(ws => FormatSetSummary(ws.Exercise.Modality, ws.Reps, ws.Weight, ws.DurationSeconds, ws.DistanceMeters))
                 .ToList()))
            .ToList();

        var date = session.StartedAt.ToString("MMM dd", CultureInfo.InvariantCulture);
        return new DashboardLastWorkout(date, exerciseGroups);
    }

    private static string FormatSetSummary(string modality, int? reps, double? weight, int? durationSec, double? distanceM)
    {
        if (modality == "cardio")
        {
            var km = (distanceM ?? 0) / 1000.0;
            return $"{km:F2}km/{FormatHms(durationSec ?? 0)}";
        }
        if (modality == "timed")
        {
            return FormatHms(durationSec ?? 0);
        }
        return $"{reps ?? 0}×{weight ?? 0:F1}";
    }

    private static string FormatHms(int totalSeconds)
    {
        if (totalSeconds < 60) return $"{totalSeconds}s";
        var m = totalSeconds / 60;
        var s = totalSeconds % 60;
        return s == 0 ? $"{m}m" : $"{m}m{s}s";
    }

    private async Task<double?> GetCurrentWeightAsync(int userId)
    {
        var latest = await db.HealthMetrics
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Date)
            .FirstOrDefaultAsync();

        return latest?.BodyWeight;
    }
}

using System.Globalization;
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
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var todayPlan = await GetTodayPlanAsync();
        var lastWorkout = await GetLastWorkoutAsync();
        var currentWeight = await GetCurrentWeightAsync();

        return Ok(new DashboardResponse(todayPlan, lastWorkout, currentWeight));
    }

    private async Task<DashboardTodayPlan?> GetTodayPlanAsync()
    {
        var dayOfWeek = (int)DateTime.UtcNow.DayOfWeek;

        var schedule = await db.Schedules
            .Include(s => s.Plan)
            .ThenInclude(p => p!.Exercises.OrderBy(pe => pe.OrderIndex))
            .ThenInclude(pe => pe.Exercise)
            .FirstOrDefaultAsync(s => s.DayOfWeek == dayOfWeek);

        if (schedule?.Plan is null)
            return null;

        var exercises = schedule.Plan.Exercises
            .Select(pe => new DashboardTodayPlanExercise(pe.Exercise.Name, pe.Sets, pe.Reps))
            .ToList();

        return new DashboardTodayPlan(schedule.Plan.Id, schedule.Plan.Name, schedule.Plan.Color, exercises);
    }

    private async Task<DashboardLastWorkout?> GetLastWorkoutAsync()
    {
        var session = await db.WorkoutSessions
            .Where(s => s.FinishedAt != null)
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
                 .Select(ws => $"{ws.Reps}\u00d7{ws.Weight:F1}")
                 .ToList()))
            .ToList();

        var date = session.StartedAt.ToString("MMM dd", CultureInfo.InvariantCulture);
        return new DashboardLastWorkout(date, exerciseGroups);
    }

    private async Task<double?> GetCurrentWeightAsync()
    {
        var latest = await db.HealthMetrics
            .OrderByDescending(m => m.Date)
            .FirstOrDefaultAsync();

        return latest?.BodyWeight;
    }
}

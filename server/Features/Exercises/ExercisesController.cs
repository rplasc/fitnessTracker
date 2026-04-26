using System.Security.Claims;
using FitTrack.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Exercises;

[ApiController]
[Route("api/v1/exercises")]
[Authorize]
public class ExercisesController(AppDbContext db) : ControllerBase
{
    private static readonly string[] ValidModalities = { "strength", "cardio", "timed" };

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = GetUserId();

        var exercises = await db.Exercises
            .Where(e => e.UserId == null || e.UserId == userId)
            .OrderBy(e => e.Category)
            .ThenBy(e => e.Name)
            .Select(e => new ExerciseResponse(e.Id, e.Name, e.Category, e.IsCustom, e.Modality))
            .ToListAsync();

        return Ok(exercises);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExerciseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Category))
            return Problem(statusCode: 400, title: "Name and category are required");

        var modality = string.IsNullOrWhiteSpace(request.Modality) ? "strength" : request.Modality.Trim().ToLowerInvariant();
        if (!ValidModalities.Contains(modality))
            return Problem(statusCode: 400, title: "Modality must be 'strength', 'cardio', or 'timed'");

        var userId = GetUserId();
        var nameTrimmed = request.Name.Trim();

        var exists = await db.Exercises.AnyAsync(e =>
            e.Name == nameTrimmed && (e.UserId == null || e.UserId == userId));
        if (exists)
            return Problem(statusCode: 409, title: "An exercise with that name already exists");

        var exercise = new Models.Exercise
        {
            UserId = userId,
            Name = nameTrimmed,
            Category = request.Category.Trim(),
            IsCustom = true,
            Modality = modality,
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = exercise.Id },
            new ExerciseResponse(exercise.Id, exercise.Name, exercise.Category, exercise.IsCustom, exercise.Modality));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetUserId();
        var exercise = await db.Exercises.FirstOrDefaultAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        return Ok(new ExerciseResponse(exercise.Id, exercise.Name, exercise.Category, exercise.IsCustom, exercise.Modality));
    }

    [HttpGet("{id:int}/last-set")]
    public async Task<IActionResult> LastSet(int id)
    {
        var userId = GetUserId();

        var exercise = await db.Exercises.FirstOrDefaultAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        var lastSet = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup)
            .OrderByDescending(ws => ws.Session.StartedAt)
            .ThenByDescending(ws => ws.SetNumber)
            .Select(ws => new
            {
                ws.Weight,
                ws.Reps,
                ws.DurationSeconds,
                ws.DistanceMeters,
                ws.Session.StartedAt,
            })
            .FirstOrDefaultAsync();

        if (lastSet is null)
            return Ok(new LastSetResponse(exercise.Modality, null, null, null, null, null));

        return Ok(new LastSetResponse(
            exercise.Modality,
            lastSet.Weight,
            lastSet.Reps,
            lastSet.DurationSeconds,
            lastSet.DistanceMeters,
            lastSet.StartedAt.ToString("yyyy-MM-dd")));
    }

    [HttpGet("{id:int}/progress")]
    public async Task<IActionResult> Progress(int id)
    {
        var userId = GetUserId();

        var exercise = await db.Exercises.FirstOrDefaultAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        var modality = exercise.Modality;

        if (modality == "strength")
        {
            var points = await db.WorkoutSets
                .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup
                    && ws.Weight != null && ws.Reps != null)
                .GroupBy(ws => ws.Session.StartedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => new ProgressPoint(
                    g.Key.ToString("yyyy-MM-dd"),
                    "strength",
                    g.Max(ws => ws.Weight),
                    g.Sum(ws => (ws.Reps ?? 0) * (ws.Weight ?? 0)),
                    g.Max(ws => (ws.Weight ?? 0) * (1 + (ws.Reps ?? 0) / 30.0)),
                    null, null, null, null))
                .ToListAsync();
            return Ok(points);
        }

        if (modality == "cardio")
        {
            var points = await db.WorkoutSets
                .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup
                    && ws.DistanceMeters != null && ws.DurationSeconds != null
                    && ws.DistanceMeters > 0 && ws.DurationSeconds > 0)
                .GroupBy(ws => ws.Session.StartedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    Date = g.Key,
                    Distance = g.Sum(ws => ws.DistanceMeters!.Value),
                    Duration = g.Sum(ws => ws.DurationSeconds!.Value),
                })
                .ToListAsync();
            var result = points.Select(p => new ProgressPoint(
                p.Date.ToString("yyyy-MM-dd"),
                "cardio",
                null, null, null,
                p.Distance,
                p.Distance > 0 ? p.Duration / p.Distance : (double?)null,
                p.Duration,
                null)).ToList();
            return Ok(result);
        }

        // timed
        var timedPoints = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup
                && ws.DurationSeconds != null && ws.DurationSeconds > 0)
            .GroupBy(ws => ws.Session.StartedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ProgressPoint(
                g.Key.ToString("yyyy-MM-dd"),
                "timed",
                null, null, null, null, null,
                g.Sum(ws => ws.DurationSeconds!.Value),
                g.Max(ws => ws.DurationSeconds!.Value)))
            .ToListAsync();
        return Ok(timedPoints);
    }

    [HttpGet("{id:int}/prs")]
    public async Task<IActionResult> Prs(int id)
    {
        var userId = GetUserId();

        var exercise = await db.Exercises.FirstOrDefaultAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        var modality = exercise.Modality;

        if (modality == "strength")
        {
            var sets = await db.WorkoutSets
                .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup
                    && ws.Weight != null && ws.Reps != null)
                .Select(ws => new { Weight = ws.Weight!.Value, Reps = ws.Reps!.Value, Date = ws.Session.StartedAt })
                .ToListAsync();
            if (sets.Count == 0)
                return Ok(new PrSummary("strength", null, null, null, null, null, null, null, null, null, null));
            var bestWeight = sets.OrderByDescending(s => s.Weight).ThenBy(s => s.Date).First();
            var bestOneRm = sets
                .Select(s => new { OneRm = s.Weight * (1 + s.Reps / 30.0), s.Date })
                .OrderByDescending(x => x.OneRm)
                .ThenBy(x => x.Date)
                .First();
            return Ok(new PrSummary(
                "strength",
                bestWeight.Weight, bestWeight.Date.ToString("yyyy-MM-dd"),
                bestOneRm.OneRm, bestOneRm.Date.ToString("yyyy-MM-dd"),
                null, null, null, null, null, null));
        }

        if (modality == "cardio")
        {
            // Aggregate per session for distance + pace PRs.
            var sessions = await db.WorkoutSets
                .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup
                    && ws.DistanceMeters != null && ws.DurationSeconds != null
                    && ws.DistanceMeters > 0 && ws.DurationSeconds > 0)
                .GroupBy(ws => ws.Session.StartedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Distance = g.Sum(ws => ws.DistanceMeters!.Value),
                    Duration = g.Sum(ws => ws.DurationSeconds!.Value),
                })
                .ToListAsync();
            if (sessions.Count == 0)
                return Ok(new PrSummary("cardio", null, null, null, null, null, null, null, null, null, null));
            var longest = sessions.OrderByDescending(s => s.Distance).ThenBy(s => s.Date).First();
            var bestPace = sessions
                .Select(s => new { Pace = s.Duration / s.Distance, s.Date })
                .OrderBy(x => x.Pace)
                .ThenBy(x => x.Date)
                .First();
            return Ok(new PrSummary(
                "cardio",
                null, null, null, null,
                longest.Distance, longest.Date.ToString("yyyy-MM-dd"),
                bestPace.Pace, bestPace.Date.ToString("yyyy-MM-dd"),
                null, null));
        }

        // timed
        var timedSets = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId && !ws.IsWarmup
                && ws.DurationSeconds != null && ws.DurationSeconds > 0)
            .Select(ws => new { Duration = ws.DurationSeconds!.Value, Date = ws.Session.StartedAt })
            .ToListAsync();
        if (timedSets.Count == 0)
            return Ok(new PrSummary("timed", null, null, null, null, null, null, null, null, null, null));
        var longestHold = timedSets.OrderByDescending(s => s.Duration).ThenBy(s => s.Date).First();
        return Ok(new PrSummary(
            "timed",
            null, null, null, null, null, null, null, null,
            longestHold.Duration, longestHold.Date.ToString("yyyy-MM-dd")));
    }
}

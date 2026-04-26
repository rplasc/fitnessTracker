using System.Security.Claims;
using FitTrack.Api.Data;
using FitTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Workouts;

[ApiController]
[Route("api/v1/workouts")]
[Authorize]
public class WorkoutsController(AppDbContext db, ILogger<WorkoutsController> logger) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("sessions")]
    public async Task<IActionResult> StartSession()
    {
        var userId = GetUserId();
        var session = new WorkoutSession { UserId = userId, StartedAt = DateTime.UtcNow };
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();

        logger.LogInformation("Workout session {SessionId} started by user {UserId}", session.Id, userId);
        return CreatedAtAction(nameof(GetSession), new { sessionId = session.Id },
            new StartSessionResponse(session.Id));
    }

    [HttpPost("sessions/{sessionId:int}/finish")]
    public async Task<IActionResult> FinishSession(int sessionId)
    {
        var userId = GetUserId();
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        if (session is null)
            return Problem(statusCode: 404, title: "Session not found");

        session.FinishedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        logger.LogInformation("Workout session {SessionId} finished", sessionId);
        return NoContent();
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> ListSessions([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        if (skip < 0) skip = 0;
        if (take <= 0) take = 50;
        if (take > 100) take = 100;

        var userId = GetUserId();
        var sessions = await db.WorkoutSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Skip(skip)
            .Take(take)
            .Select(s => new SessionListItem(
                s.Id,
                s.StartedAt,
                s.FinishedAt,
                s.Sets.Count))
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpDelete("sessions/{sessionId:int}")]
    public async Task<IActionResult> DeleteSession(int sessionId)
    {
        var userId = GetUserId();
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        if (session is null)
            return Problem(statusCode: 404, title: "Session not found");

        db.WorkoutSessions.Remove(session);
        await db.SaveChangesAsync();

        logger.LogInformation("Workout session {SessionId} deleted by user {UserId}", sessionId, userId);
        return NoContent();
    }

    [HttpGet("sessions/{sessionId:int}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var userId = GetUserId();
        var session = await db.WorkoutSessions
            .Include(s => s.Sets)
            .ThenInclude(ws => ws.Exercise)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

        if (session is null)
            return Problem(statusCode: 404, title: "Session not found");

        var sets = session.Sets
            .OrderBy(ws => ws.SetNumber)
            .Select(ws => new SetResponse(
                ws.Id,
                ws.ExerciseId,
                ws.Exercise.Name,
                ws.Exercise.Modality,
                ws.Reps,
                ws.Weight,
                ws.DurationSeconds,
                ws.DistanceMeters,
                ws.SetNumber,
                ws.Rpe,
                ws.Notes,
                ws.IsWarmup))
            .ToList();

        return Ok(new SessionSummaryResponse(session.Id, session.StartedAt, session.FinishedAt, session.Notes, sets));
    }

    [HttpPost("sets")]
    public async Task<IActionResult> AddSet([FromBody] AddSetRequest request)
    {
        var userId = GetUserId();

        if (request.Rpe is not null && (request.Rpe < 1 || request.Rpe > 10))
            return Problem(statusCode: 400, title: "RPE must be between 1 and 10");

        var sessionExists = await db.WorkoutSessions
            .AnyAsync(s => s.Id == request.SessionId && s.UserId == userId);
        if (!sessionExists)
            return Problem(statusCode: 404, title: "Session not found");

        var exercise = await db.Exercises
            .FirstOrDefaultAsync(e => e.Id == request.ExerciseId && (e.UserId == null || e.UserId == userId));
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        switch (exercise.Modality)
        {
            case "strength":
                if (request.Reps is null or <= 0 || request.Weight is null || request.Weight < 0)
                    return Problem(statusCode: 400, title: "Strength sets require reps > 0 and weight ≥ 0");
                break;
            case "cardio":
                if (request.DurationSeconds is null or <= 0 || request.DistanceMeters is null || request.DistanceMeters <= 0)
                    return Problem(statusCode: 400, title: "Cardio sets require duration > 0 and distance > 0");
                break;
            case "timed":
                if (request.DurationSeconds is null or <= 0)
                    return Problem(statusCode: 400, title: "Timed sets require duration > 0");
                break;
        }

        bool isWeightPr = false, isOneRmPr = false, isDistancePr = false, isPacePr = false, isDurationPr = false;
        if (!request.IsWarmup)
        {
            if (exercise.Modality == "strength")
            {
                var priorBests = await db.WorkoutSets
                    .Where(ws => ws.ExerciseId == request.ExerciseId
                        && ws.Session.UserId == userId
                        && !ws.IsWarmup
                        && ws.Weight != null && ws.Reps != null)
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        MaxWeight = g.Max(ws => ws.Weight),
                        MaxOneRm = g.Max(ws => ws.Weight * (1 + ws.Reps / 30.0)),
                    })
                    .FirstOrDefaultAsync();

                var w = request.Weight!.Value;
                var r = request.Reps!.Value;
                var newOneRm = w * (1 + r / 30.0);
                isWeightPr = priorBests is null || w > (priorBests.MaxWeight ?? 0);
                isOneRmPr = priorBests is null || newOneRm > (priorBests.MaxOneRm ?? 0);
            }
            else if (exercise.Modality == "cardio")
            {
                var priorBests = await db.WorkoutSets
                    .Where(ws => ws.ExerciseId == request.ExerciseId
                        && ws.Session.UserId == userId
                        && !ws.IsWarmup
                        && ws.DistanceMeters != null && ws.DurationSeconds != null
                        && ws.DistanceMeters > 0 && ws.DurationSeconds > 0)
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        MaxDistance = g.Max(ws => ws.DistanceMeters),
                        BestPace = g.Min(ws => ws.DurationSeconds!.Value / ws.DistanceMeters!.Value),
                    })
                    .FirstOrDefaultAsync();

                var dist = request.DistanceMeters!.Value;
                var dur = request.DurationSeconds!.Value;
                var pace = dur / dist;
                isDistancePr = priorBests is null || dist > (priorBests.MaxDistance ?? 0);
                isPacePr = priorBests is null || pace < priorBests.BestPace;
            }
            else if (exercise.Modality == "timed")
            {
                var priorBest = await db.WorkoutSets
                    .Where(ws => ws.ExerciseId == request.ExerciseId
                        && ws.Session.UserId == userId
                        && !ws.IsWarmup
                        && ws.DurationSeconds != null && ws.DurationSeconds > 0)
                    .MaxAsync(ws => (int?)ws.DurationSeconds);
                isDurationPr = priorBest is null || request.DurationSeconds > priorBest;
            }
        }

        var nextSetNumber = (await db.WorkoutSets
            .Where(ws => ws.SessionId == request.SessionId && ws.ExerciseId == request.ExerciseId)
            .MaxAsync(ws => (int?)ws.SetNumber) ?? 0) + 1;

        var notes = string.IsNullOrWhiteSpace(request.Notes)
            ? null
            : request.Notes.Trim().Length > 200 ? request.Notes.Trim()[..200] : request.Notes.Trim();

        var set = new WorkoutSet
        {
            SessionId = request.SessionId,
            ExerciseId = request.ExerciseId,
            Reps = exercise.Modality == "strength" ? request.Reps : null,
            Weight = exercise.Modality == "strength" ? request.Weight : null,
            DurationSeconds = exercise.Modality is "cardio" or "timed" ? request.DurationSeconds : null,
            DistanceMeters = exercise.Modality == "cardio" ? request.DistanceMeters : null,
            SetNumber = nextSetNumber,
            Rpe = request.Rpe,
            Notes = notes,
            IsWarmup = request.IsWarmup,
        };

        db.WorkoutSets.Add(set);
        await db.SaveChangesAsync();

        logger.LogInformation("Set {SetId} added to session {SessionId}", set.Id, request.SessionId);
        return CreatedAtAction(nameof(GetSession), new { sessionId = request.SessionId },
            new AddSetResponse(set.Id, set.SetNumber, isWeightPr, isOneRmPr, isDistancePr, isPacePr, isDurationPr));
    }

    [HttpPatch("sets/{setId:int}")]
    public async Task<IActionResult> UpdateSet(int setId, [FromBody] UpdateSetRequest request)
    {
        var userId = GetUserId();

        if (request.Rpe is not null && (request.Rpe < 1 || request.Rpe > 10))
            return Problem(statusCode: 400, title: "RPE must be between 1 and 10");

        var set = await db.WorkoutSets
            .Include(ws => ws.Session)
            .FirstOrDefaultAsync(ws => ws.Id == setId && ws.Session.UserId == userId);
        if (set is null)
            return Problem(statusCode: 404, title: "Set not found");

        if (request.Reps is not null) set.Reps = request.Reps.Value;
        if (request.Weight is not null) set.Weight = request.Weight.Value;
        if (request.DurationSeconds is not null) set.DurationSeconds = request.DurationSeconds.Value;
        if (request.DistanceMeters is not null) set.DistanceMeters = request.DistanceMeters.Value;
        if (request.Rpe is not null) set.Rpe = request.Rpe;
        if (request.Notes is not null)
        {
            var trimmed = request.Notes.Trim();
            set.Notes = trimmed.Length == 0 ? null : trimmed.Length > 200 ? trimmed[..200] : trimmed;
        }
        if (request.IsWarmup is not null) set.IsWarmup = request.IsWarmup.Value;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("sets/{setId:int}")]
    public async Task<IActionResult> DeleteSet(int setId)
    {
        var userId = GetUserId();
        var set = await db.WorkoutSets
            .Include(ws => ws.Session)
            .FirstOrDefaultAsync(ws => ws.Id == setId && ws.Session.UserId == userId);
        if (set is null)
            return Problem(statusCode: 404, title: "Set not found");

        db.WorkoutSets.Remove(set);
        await db.SaveChangesAsync();

        logger.LogInformation("Set {SetId} deleted", setId);
        return NoContent();
    }
}

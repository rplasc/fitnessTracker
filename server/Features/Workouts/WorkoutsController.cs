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
    public async Task<IActionResult> ListSessions()
    {
        var userId = GetUserId();
        var sessions = await db.WorkoutSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new SessionListItem(
                s.Id,
                s.StartedAt,
                s.FinishedAt,
                s.Sets.Count))
            .ToListAsync();

        return Ok(sessions);
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
            .Select(ws => new SetResponse(ws.Id, ws.ExerciseId, ws.Exercise.Name, ws.Reps, ws.Weight, ws.SetNumber))
            .ToList();

        return Ok(new SessionSummaryResponse(session.Id, session.StartedAt, session.FinishedAt, session.Notes, sets));
    }

    [HttpPost("sets")]
    public async Task<IActionResult> AddSet([FromBody] AddSetRequest request)
    {
        var userId = GetUserId();

        var sessionExists = await db.WorkoutSessions
            .AnyAsync(s => s.Id == request.SessionId && s.UserId == userId);
        if (!sessionExists)
            return Problem(statusCode: 404, title: "Session not found");

        var exerciseExists = await db.Exercises
            .AnyAsync(e => e.Id == request.ExerciseId && (e.UserId == null || e.UserId == userId));
        if (!exerciseExists)
            return Problem(statusCode: 404, title: "Exercise not found");

        var nextSetNumber = (await db.WorkoutSets
            .Where(ws => ws.SessionId == request.SessionId && ws.ExerciseId == request.ExerciseId)
            .MaxAsync(ws => (int?)ws.SetNumber) ?? 0) + 1;

        var set = new WorkoutSet
        {
            SessionId = request.SessionId,
            ExerciseId = request.ExerciseId,
            Reps = request.Reps,
            Weight = request.Weight,
            SetNumber = nextSetNumber
        };

        db.WorkoutSets.Add(set);
        await db.SaveChangesAsync();

        logger.LogInformation("Set {SetId} added to session {SessionId}", set.Id, request.SessionId);
        return CreatedAtAction(nameof(GetSession), new { sessionId = request.SessionId },
            new AddSetResponse(set.Id, set.SetNumber));
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

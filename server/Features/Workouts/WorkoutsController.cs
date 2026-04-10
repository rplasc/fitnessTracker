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
    [HttpPost("sessions")]
    public async Task<IActionResult> StartSession()
    {
        var session = new WorkoutSession { StartedAt = DateTime.UtcNow };
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync();

        logger.LogInformation("Workout session {SessionId} started", session.Id);
        return CreatedAtAction(nameof(GetSession), new { sessionId = session.Id },
            new StartSessionResponse(session.Id));
    }

    [HttpPost("sessions/{sessionId:int}/finish")]
    public async Task<IActionResult> FinishSession(int sessionId)
    {
        var session = await db.WorkoutSessions.FindAsync(sessionId);
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
        var sessions = await db.WorkoutSessions
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
        var session = await db.WorkoutSessions
            .Include(s => s.Sets)
            .ThenInclude(ws => ws.Exercise)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

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
        var sessionExists = await db.WorkoutSessions.AnyAsync(s => s.Id == request.SessionId);
        if (!sessionExists)
            return Problem(statusCode: 404, title: "Session not found");

        var exerciseExists = await db.Exercises.AnyAsync(e => e.Id == request.ExerciseId);
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
        var set = await db.WorkoutSets.FindAsync(setId);
        if (set is null)
            return Problem(statusCode: 404, title: "Set not found");

        db.WorkoutSets.Remove(set);
        await db.SaveChangesAsync();

        logger.LogInformation("Set {SetId} deleted", setId);
        return NoContent();
    }
}

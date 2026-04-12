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
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = GetUserId();

        var exercises = await db.Exercises
            .Where(e => e.UserId == null || e.UserId == userId)
            .OrderBy(e => e.Category)
            .ThenBy(e => e.Name)
            .Select(e => new ExerciseResponse(e.Id, e.Name, e.Category, e.IsCustom))
            .ToListAsync();

        return Ok(exercises);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExerciseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Category))
            return Problem(statusCode: 400, title: "Name and category are required");

        var userId = GetUserId();
        var nameTrimmed = request.Name.Trim();

        // Name must be unique across global exercises and this user's custom exercises
        var exists = await db.Exercises.AnyAsync(e =>
            e.Name == nameTrimmed && (e.UserId == null || e.UserId == userId));
        if (exists)
            return Problem(statusCode: 409, title: "An exercise with that name already exists");

        var exercise = new Models.Exercise
        {
            UserId = userId,
            Name = nameTrimmed,
            Category = request.Category.Trim(),
            IsCustom = true
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = exercise.Id },
            new ExerciseResponse(exercise.Id, exercise.Name, exercise.Category, exercise.IsCustom));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetUserId();
        var exercise = await db.Exercises.FirstOrDefaultAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        return Ok(new ExerciseResponse(exercise.Id, exercise.Name, exercise.Category, exercise.IsCustom));
    }

    [HttpGet("{id:int}/last-weight")]
    public async Task<IActionResult> LastWeight(int id)
    {
        var userId = GetUserId();

        var exerciseExists = await db.Exercises.AnyAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (!exerciseExists)
            return Problem(statusCode: 404, title: "Exercise not found");

        var lastSet = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId)
            .OrderByDescending(ws => ws.Session.StartedAt)
            .ThenByDescending(ws => ws.SetNumber)
            .Select(ws => new { ws.Weight, ws.Reps, ws.Session.StartedAt })
            .FirstOrDefaultAsync();

        if (lastSet is null)
            return Ok(new LastWeightResponse(null, null, null));

        return Ok(new LastWeightResponse(
            lastSet.Weight,
            lastSet.Reps,
            lastSet.StartedAt.ToString("yyyy-MM-dd")));
    }

    [HttpGet("{id:int}/progress")]
    public async Task<IActionResult> Progress(int id)
    {
        var userId = GetUserId();

        var exerciseExists = await db.Exercises.AnyAsync(e =>
            e.Id == id && (e.UserId == null || e.UserId == userId));
        if (!exerciseExists)
            return Problem(statusCode: 404, title: "Exercise not found");

        var points = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id && ws.Session.UserId == userId)
            .GroupBy(ws => ws.Session.StartedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ProgressPoint(
                g.Key.ToString("yyyy-MM-dd"),
                g.Max(ws => ws.Weight),
                g.Sum(ws => ws.Reps * ws.Weight)))
            .ToListAsync();

        return Ok(points);
    }
}

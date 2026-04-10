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
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var exercises = await db.Exercises
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

        var exists = await db.Exercises.AnyAsync(e => e.Name == request.Name);
        if (exists)
            return Problem(statusCode: 409, title: "An exercise with that name already exists");

        var exercise = new Models.Exercise
        {
            Name = request.Name.Trim(),
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
        var exercise = await db.Exercises.FindAsync(id);
        if (exercise is null)
            return Problem(statusCode: 404, title: "Exercise not found");

        return Ok(new ExerciseResponse(exercise.Id, exercise.Name, exercise.Category, exercise.IsCustom));
    }

    [HttpGet("{id:int}/last-weight")]
    public async Task<IActionResult> LastWeight(int id)
    {
        var exerciseExists = await db.Exercises.AnyAsync(e => e.Id == id);
        if (!exerciseExists)
            return Problem(statusCode: 404, title: "Exercise not found");

        var lastSet = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id)
            .OrderByDescending(ws => ws.Session.StartedAt)
            .ThenByDescending(ws => ws.SetNumber)
            .Select(ws => new
            {
                ws.Weight,
                ws.Reps,
                ws.Session.StartedAt
            })
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
        var exerciseExists = await db.Exercises.AnyAsync(e => e.Id == id);
        if (!exerciseExists)
            return Problem(statusCode: 404, title: "Exercise not found");

        var points = await db.WorkoutSets
            .Where(ws => ws.ExerciseId == id)
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

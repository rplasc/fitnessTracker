using System.Security.Claims;
using FitTrack.Api.Data;
using FitTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Plans;

[ApiController]
[Route("api/v1/plans")]
[Authorize]
public class PlansController(AppDbContext db, ILogger<PlansController> logger) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = GetUserId();
        var plans = await db.Plans
            .Where(p => p.UserId == userId)
            .Select(p => new PlanSummary(p.Id, p.Name, p.Description, p.Color))
            .ToListAsync();

        return Ok(plans);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Problem(statusCode: 400, title: "Plan name is required");

        var userId = GetUserId();
        var plan = new Plan
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Color = request.Color?.Trim()
        };

        db.Plans.Add(plan);
        await db.SaveChangesAsync();

        logger.LogInformation("Plan {PlanId} created by user {UserId}", plan.Id, userId);
        return CreatedAtAction(nameof(GetById), new { planId = plan.Id }, ToDetail(plan, []));
    }

    [HttpGet("{planId:int}")]
    public async Task<IActionResult> GetById(int planId)
    {
        var userId = GetUserId();
        var plan = await db.Plans
            .Include(p => p.Exercises.OrderBy(pe => pe.OrderIndex))
            .ThenInclude(pe => pe.Exercise)
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId);

        if (plan is null)
            return Problem(statusCode: 404, title: "Plan not found");

        return Ok(ToDetail(plan, plan.Exercises));
    }

    [HttpPut("{planId:int}")]
    public async Task<IActionResult> Update(int planId, [FromBody] UpdatePlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Problem(statusCode: 400, title: "Plan name is required");

        var userId = GetUserId();
        var plan = await db.Plans
            .Include(p => p.Exercises.OrderBy(pe => pe.OrderIndex))
            .ThenInclude(pe => pe.Exercise)
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId);

        if (plan is null)
            return Problem(statusCode: 404, title: "Plan not found");

        plan.Name = request.Name.Trim();
        plan.Description = request.Description?.Trim();
        plan.Color = request.Color?.Trim();

        await db.SaveChangesAsync();

        logger.LogInformation("Plan {PlanId} updated", planId);
        return Ok(ToDetail(plan, plan.Exercises));
    }

    [HttpDelete("{planId:int}")]
    public async Task<IActionResult> Delete(int planId)
    {
        var userId = GetUserId();
        var plan = await db.Plans
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId);
        if (plan is null)
            return Problem(statusCode: 404, title: "Plan not found");

        db.Plans.Remove(plan);
        await db.SaveChangesAsync();

        logger.LogInformation("Plan {PlanId} deleted", planId);
        return NoContent();
    }

    [HttpPost("{planId:int}/exercises")]
    public async Task<IActionResult> AddExercise(int planId, [FromBody] AddPlanExerciseRequest request)
    {
        var userId = GetUserId();

        var planExists = await db.Plans.AnyAsync(p => p.Id == planId && p.UserId == userId);
        if (!planExists)
            return Problem(statusCode: 404, title: "Plan not found");

        var exerciseExists = await db.Exercises
            .AnyAsync(e => e.Id == request.ExerciseId && (e.UserId == null || e.UserId == userId));
        if (!exerciseExists)
            return Problem(statusCode: 404, title: "Exercise not found");

        var maxOrder = await db.PlanExercises
            .Where(pe => pe.PlanId == planId)
            .MaxAsync(pe => (int?)pe.OrderIndex) ?? -1;

        var planExercise = new PlanExercise
        {
            PlanId = planId,
            ExerciseId = request.ExerciseId,
            Sets = request.Sets,
            Reps = request.Reps,
            TargetWeight = request.TargetWeight,
            OrderIndex = maxOrder + 1
        };

        db.PlanExercises.Add(planExercise);
        await db.SaveChangesAsync();

        await db.Entry(planExercise).Reference(pe => pe.Exercise).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { planId },
            new PlanExerciseResponse(planExercise.Id, planExercise.ExerciseId, planExercise.Exercise.Name,
                planExercise.OrderIndex, planExercise.Sets, planExercise.Reps, planExercise.TargetWeight));
    }

    [HttpDelete("{planId:int}/exercises/{planExerciseId:int}")]
    public async Task<IActionResult> RemoveExercise(int planId, int planExerciseId)
    {
        var userId = GetUserId();
        var pe = await db.PlanExercises
            .Include(x => x.Plan)
            .FirstOrDefaultAsync(x => x.Id == planExerciseId && x.PlanId == planId && x.Plan.UserId == userId);
        if (pe is null)
            return Problem(statusCode: 404, title: "Plan exercise not found");

        db.PlanExercises.Remove(pe);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{planId:int}/exercises/order")]
    public async Task<IActionResult> Reorder(int planId, [FromBody] ReorderRequest request)
    {
        var userId = GetUserId();
        var planExists = await db.Plans.AnyAsync(p => p.Id == planId && p.UserId == userId);
        if (!planExists)
            return Problem(statusCode: 404, title: "Plan not found");

        var planExercises = await db.PlanExercises
            .Where(pe => pe.PlanId == planId)
            .ToListAsync();

        await using var tx = await db.Database.BeginTransactionAsync();

        for (var i = 0; i < request.OrderedIds.Count; i++)
        {
            var pe = planExercises.FirstOrDefault(p => p.Id == request.OrderedIds[i]);
            if (pe is not null)
                pe.OrderIndex = i;
        }

        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return NoContent();
    }

    private static PlanDetailResponse ToDetail(Plan plan, IEnumerable<PlanExercise> exercises)
    {
        var exerciseList = exercises
            .Select(pe => new PlanExerciseResponse(
                pe.Id, pe.ExerciseId, pe.Exercise.Name,
                pe.OrderIndex, pe.Sets, pe.Reps, pe.TargetWeight))
            .ToList();

        return new PlanDetailResponse(plan.Id, plan.Name, plan.Description, plan.Color, exerciseList);
    }
}

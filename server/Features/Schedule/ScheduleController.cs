using FitTrack.Api.Data;
using FitTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Schedule;

[ApiController]
[Route("api/v1/schedule")]
[Authorize]
public class ScheduleController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var rows = await db.Schedules
            .Include(s => s.Plan)
            .ToListAsync();

        var dict = rows.ToDictionary(s => s.DayOfWeek);

        var entries = Enumerable.Range(0, 7)
            .Select(day => dict.TryGetValue(day, out var row)
                ? new ScheduleEntry(day, row.PlanId, row.Plan?.Name, row.Plan?.Color)
                : new ScheduleEntry(day, null, null, null))
            .ToList();

        return Ok(entries);
    }

    [HttpPut("{dayOfWeek:int}")]
    public async Task<IActionResult> Upsert(int dayOfWeek, [FromBody] UpsertScheduleRequest request)
    {
        if (dayOfWeek < 0 || dayOfWeek > 6)
            return Problem(statusCode: 400, title: "Day of week must be 0 (Sunday) through 6 (Saturday)");

        if (request.PlanId is not null)
        {
            var planExists = await db.Plans.AnyAsync(p => p.Id == request.PlanId);
            if (!planExists)
                return Problem(statusCode: 404, title: "Plan not found");
        }

        var existing = await db.Schedules
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.DayOfWeek == dayOfWeek);

        if (existing is not null)
        {
            existing.PlanId = request.PlanId;
            await db.SaveChangesAsync();

            await db.Entry(existing).Reference(s => s.Plan).LoadAsync();
            return Ok(new ScheduleEntry(dayOfWeek, existing.PlanId, existing.Plan?.Name, existing.Plan?.Color));
        }

        var schedule = new Models.Schedule { DayOfWeek = dayOfWeek, PlanId = request.PlanId };
        db.Schedules.Add(schedule);
        await db.SaveChangesAsync();

        Models.Plan? plan = null;
        if (request.PlanId is not null)
            plan = await db.Plans.FindAsync(request.PlanId);

        return Ok(new ScheduleEntry(dayOfWeek, request.PlanId, plan?.Name, plan?.Color));
    }
}

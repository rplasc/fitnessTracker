using System.Security.Claims;
using FitTrack.Api.Data;
using FitTrack.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Features.Metrics;

[ApiController]
[Route("api/v1/metrics")]
[Authorize]
public class MetricsController(AppDbContext db, ILogger<MetricsController> logger) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int limit = 30)
    {
        var userId = GetUserId();
        limit = Math.Clamp(limit, 1, 365);

        var metrics = await db.HealthMetrics
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Date)
            .Take(limit)
            .Select(m => new MetricResponse(
                m.Id,
                m.Date.ToString("yyyy-MM-dd"),
                m.BodyWeight,
                m.LoggedAt))
            .ToListAsync();

        return Ok(metrics);
    }

    [HttpPut("{date}")]
    public async Task<IActionResult> Upsert(string date, [FromBody] UpsertMetricRequest request)
    {
        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out var parsedDate))
            return Problem(statusCode: 400, title: "Invalid date format. Use yyyy-MM-dd");

        var userId = GetUserId();

        var existing = await db.HealthMetrics
            .FirstOrDefaultAsync(m => m.UserId == userId && m.Date == parsedDate);

        if (existing is not null)
        {
            existing.BodyWeight = request.BodyWeight;
            existing.LoggedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            logger.LogInformation("Metric updated for {Date}", date);
            return Ok(new MetricResponse(existing.Id, existing.Date.ToString("yyyy-MM-dd"), existing.BodyWeight, existing.LoggedAt));
        }

        var metric = new HealthMetric
        {
            UserId = userId,
            Date = parsedDate,
            BodyWeight = request.BodyWeight,
            LoggedAt = DateTime.UtcNow
        };

        db.HealthMetrics.Add(metric);
        await db.SaveChangesAsync();

        logger.LogInformation("Metric created for {Date}", date);
        return StatusCode(201, new MetricResponse(metric.Id, metric.Date.ToString("yyyy-MM-dd"), metric.BodyWeight, metric.LoggedAt));
    }

    [HttpDelete("{metricId:int}")]
    public async Task<IActionResult> Delete(int metricId)
    {
        var userId = GetUserId();
        var metric = await db.HealthMetrics
            .FirstOrDefaultAsync(m => m.Id == metricId && m.UserId == userId);
        if (metric is null)
            return Problem(statusCode: 404, title: "Metric not found");

        db.HealthMetrics.Remove(metric);
        await db.SaveChangesAsync();

        logger.LogInformation("Metric {MetricId} deleted", metricId);
        return NoContent();
    }
}

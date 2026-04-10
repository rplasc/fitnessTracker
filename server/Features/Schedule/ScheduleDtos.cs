namespace FitTrack.Api.Features.Schedule;

public record ScheduleEntry(int DayOfWeek, int? PlanId, string? PlanName, string? PlanColor);
public record UpsertScheduleRequest(int? PlanId);

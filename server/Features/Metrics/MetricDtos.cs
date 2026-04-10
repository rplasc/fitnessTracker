namespace FitTrack.Api.Features.Metrics;

public record MetricResponse(int Id, string Date, double BodyWeight, DateTime LoggedAt);
public record UpsertMetricRequest(double BodyWeight);

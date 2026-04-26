namespace FitTrack.Api.Features.Settings;

public record SettingsResponse(string WeightUnit, string HeightUnit, decimal? HeightCm, int RestSeconds);
public record PatchSettingsRequest(string? WeightUnit, string? HeightUnit, decimal? HeightCm, int? RestSeconds);

namespace FitTrack.Api.Features.Settings;

public record SettingsResponse(string WeightUnit, string HeightUnit, decimal? HeightCm);
public record PatchSettingsRequest(string? WeightUnit, string? HeightUnit, decimal? HeightCm);

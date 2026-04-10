namespace FitTrack.Api.Features.Settings;

public record SettingsResponse(string WeightUnit);
public record PatchSettingsRequest(string? WeightUnit);

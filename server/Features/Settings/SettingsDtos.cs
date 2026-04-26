namespace FitTrack.Api.Features.Settings;

public record SettingsResponse(
    string WeightUnit,
    string HeightUnit,
    decimal? HeightCm,
    int RestSeconds,
    int? WeeklyWorkoutGoal,
    decimal? TargetWeightKg);

public record PatchSettingsRequest(
    string? WeightUnit,
    string? HeightUnit,
    decimal? HeightCm,
    int? RestSeconds,
    int? WeeklyWorkoutGoal,
    decimal? TargetWeightKg);

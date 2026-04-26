namespace FitTrack.Api.Features.Exercises;

public record ExerciseResponse(int Id, string Name, string Category, bool IsCustom, string Modality);
public record CreateExerciseRequest(string Name, string Category, string? Modality);
public record LastSetResponse(
    string Modality,
    double? Weight,
    int? Reps,
    int? DurationSeconds,
    double? DistanceMeters,
    string? Date);
public record ProgressPoint(
    string Date,
    string Modality,
    double? MaxWeight,
    double? TotalVolume,
    double? EstimatedOneRm,
    double? TotalDistanceMeters,
    double? AvgPaceSecondsPerMeter,
    int? TotalDurationSeconds,
    int? MaxDurationSeconds);
public record PrSummary(
    string Modality,
    double? MaxWeight,
    string? MaxWeightDate,
    double? EstimatedOneRm,
    string? OneRmDate,
    double? LongestDistanceMeters,
    string? LongestDistanceDate,
    double? BestPaceSecondsPerMeter,
    string? BestPaceDate,
    int? LongestDurationSeconds,
    string? LongestDurationDate);

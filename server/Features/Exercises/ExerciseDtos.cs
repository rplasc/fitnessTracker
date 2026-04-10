namespace FitTrack.Api.Features.Exercises;

public record ExerciseResponse(int Id, string Name, string Category, bool IsCustom);
public record CreateExerciseRequest(string Name, string Category);
public record LastWeightResponse(double? Weight, int? Reps, string? Date);
public record ProgressPoint(string Date, double MaxWeight, double TotalVolume);

namespace FitTrack.Api.Features.Workouts;

public record StartSessionResponse(int SessionId);
public record FinishSessionRequest(string? Notes);
public record UpdateSessionRequest(string? Notes);
public record AddSetRequest(
    int SessionId,
    int ExerciseId,
    int? Reps,
    double? Weight,
    int? DurationSeconds,
    double? DistanceMeters,
    double? Rpe,
    string? Notes,
    bool IsWarmup);
public record AddSetResponse(int Id, int SetNumber, bool IsWeightPr, bool IsOneRmPr, bool IsDistancePr, bool IsPacePr, bool IsDurationPr);
public record UpdateSetRequest(
    int? Reps,
    double? Weight,
    int? DurationSeconds,
    double? DistanceMeters,
    double? Rpe,
    string? Notes,
    bool? IsWarmup);
public record SetResponse(
    int Id,
    int ExerciseId,
    string ExerciseName,
    string ExerciseModality,
    int? Reps,
    double? Weight,
    int? DurationSeconds,
    double? DistanceMeters,
    int SetNumber,
    double? Rpe,
    string? Notes,
    bool IsWarmup);
public record SessionSummaryResponse(int Id, DateTime StartedAt, DateTime? FinishedAt, string? Notes, List<SetResponse> Sets);
public record SessionListItem(int Id, DateTime StartedAt, DateTime? FinishedAt, int SetCount);

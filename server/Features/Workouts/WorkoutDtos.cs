namespace FitTrack.Api.Features.Workouts;

public record StartSessionResponse(int SessionId);
public record FinishSessionRequest(string? Notes);
public record AddSetRequest(int SessionId, int ExerciseId, int Reps, double Weight);
public record AddSetResponse(int Id, int SetNumber);
public record SetResponse(int Id, int ExerciseId, string ExerciseName, int Reps, double Weight, int SetNumber);
public record SessionSummaryResponse(int Id, DateTime StartedAt, DateTime? FinishedAt, string? Notes, List<SetResponse> Sets);
public record SessionListItem(int Id, DateTime StartedAt, DateTime? FinishedAt, int SetCount);

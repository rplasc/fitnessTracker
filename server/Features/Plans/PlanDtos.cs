namespace FitTrack.Api.Features.Plans;

public record PlanSummary(int Id, string Name, string? Description, string? Color);
public record PlanExerciseResponse(int Id, int ExerciseId, string ExerciseName, int OrderIndex, int Sets, int Reps, double? TargetWeight);
public record PlanDetailResponse(int Id, string Name, string? Description, string? Color, List<PlanExerciseResponse> Exercises);
public record CreatePlanRequest(string Name, string? Description, string? Color);
public record UpdatePlanRequest(string Name, string? Description, string? Color);
public record AddPlanExerciseRequest(int ExerciseId, int Sets, int Reps, double? TargetWeight);
public record ReorderRequest(List<int> OrderedIds);

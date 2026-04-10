namespace FitTrack.Api.Features.Dashboard;

public record DashboardTodayPlanExercise(string Name, int Sets, int Reps);
public record DashboardTodayPlan(int Id, string Name, string? Color, List<DashboardTodayPlanExercise> Exercises);
public record DashboardLastWorkoutExercise(string Name, List<string> Sets);
public record DashboardLastWorkout(string Date, List<DashboardLastWorkoutExercise> Exercises);
public record DashboardResponse(DashboardTodayPlan? TodayPlan, DashboardLastWorkout? LastWorkout, double? CurrentWeight);

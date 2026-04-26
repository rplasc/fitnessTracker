namespace FitTrack.Api.Models;

public class WorkoutSet
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public WorkoutSession Session { get; set; } = null!;
    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public int? Reps { get; set; }
    public double? Weight { get; set; }
    public int? DurationSeconds { get; set; }
    public double? DistanceMeters { get; set; }
    public int SetNumber { get; set; }
    public double? Rpe { get; set; }
    public string? Notes { get; set; }
    public bool IsWarmup { get; set; }
}

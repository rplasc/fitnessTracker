namespace FitTrack.Api.Models;

public class PlanExercise
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public int OrderIndex { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public double? TargetWeight { get; set; }
}

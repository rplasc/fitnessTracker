namespace FitTrack.Api.Models;

public class Exercise
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsCustom { get; set; }

    public ICollection<WorkoutSet> WorkoutSets { get; set; } = [];
    public ICollection<PlanExercise> PlanExercises { get; set; } = [];
}

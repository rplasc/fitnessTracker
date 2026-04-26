namespace FitTrack.Api.Models;

public class Exercise
{
    public int Id { get; set; }
    public int? UserId { get; set; }  // null = global seeded exercise
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsCustom { get; set; }
    public string Modality { get; set; } = "strength"; // strength | cardio | timed

    public User? User { get; set; }
    public ICollection<WorkoutSet> WorkoutSets { get; set; } = [];
    public ICollection<PlanExercise> PlanExercises { get; set; } = [];
}

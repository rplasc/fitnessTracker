namespace FitTrack.Api.Models;

public class Plan
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }

    public User? User { get; set; }
    public ICollection<PlanExercise> Exercises { get; set; } = [];
    public ICollection<Schedule> Schedules { get; set; } = [];
}

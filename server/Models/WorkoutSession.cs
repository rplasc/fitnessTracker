namespace FitTrack.Api.Models;

public class WorkoutSession
{
    public int Id { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? Notes { get; set; }

    public ICollection<WorkoutSet> Sets { get; set; } = [];
}

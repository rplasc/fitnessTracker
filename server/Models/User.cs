namespace FitTrack.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = [];
    public ICollection<HealthMetric> HealthMetrics { get; set; } = [];
    public ICollection<Plan> Plans { get; set; } = [];
    public ICollection<Schedule> Schedules { get; set; } = [];
    public Setting? Setting { get; set; }
    public ICollection<Exercise> CustomExercises { get; set; } = [];
}

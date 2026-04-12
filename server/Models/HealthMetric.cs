namespace FitTrack.Api.Models;

public class HealthMetric
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public DateOnly Date { get; set; }
    public double BodyWeight { get; set; }
    public DateTime LoggedAt { get; set; }

    public User? User { get; set; }
}

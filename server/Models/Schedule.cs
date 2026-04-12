namespace FitTrack.Api.Models;

public class Schedule
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int DayOfWeek { get; set; }
    public int? PlanId { get; set; }

    public User? User { get; set; }
    public Plan? Plan { get; set; }
}

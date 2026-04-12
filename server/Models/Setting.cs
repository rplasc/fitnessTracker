namespace FitTrack.Api.Models;

public class Setting
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string WeightUnit { get; set; } = "kg";

    public User? User { get; set; }
}

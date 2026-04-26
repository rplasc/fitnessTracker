namespace FitTrack.Api.Models;

public class Setting
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string WeightUnit { get; set; } = "kg";
    public string HeightUnit { get; set; } = "cm";
    public decimal? HeightCm { get; set; }
    public bool OnboardingComplete { get; set; } = false;
    public int RestSeconds { get; set; } = 90;

    public User? User { get; set; }
}

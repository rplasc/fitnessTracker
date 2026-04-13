namespace FitTrack.Api.Features.Auth;

public record RegisterRequest(string Username, string Password);
public record LoginRequest(string Username, string Password);
public record MeResponse(bool IsAuthenticated, string? Username, string WeightUnit, bool OnboardingComplete, string? DisplayName);

public record CompleteOnboardingRequest(
    string DisplayName,
    decimal? HeightCm,
    decimal? InitialWeightKg,
    string? PlanName,
    string? PlanColor
);

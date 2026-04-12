namespace FitTrack.Api.Features.Auth;

public record RegisterRequest(string Username, string Password);
public record LoginRequest(string Username, string Password);
public record MeResponse(bool IsAuthenticated, string? Username, string WeightUnit);

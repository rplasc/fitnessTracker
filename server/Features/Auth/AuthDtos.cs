namespace FitTrack.Api.Features.Auth;

public record LoginRequest(string Passcode);
public record MeResponse(bool IsAuthenticated, string WeightUnit);

using System.Text.Json;
using System.Text.Json.Serialization;
using FitTrack.Api.Data;
using FitTrack.Api.Data.Seed;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var dbPath = builder.Configuration["FitTrack:DbPath"] ?? "fittrack.db";
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite($"Data Source={dbPath}"));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.None
            : CookieSecurePolicy.Always;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);

        options.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            ctx.Response.ContentType = "application/problem+json";
            return ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 401,
                Title = "Unauthorized",
                Detail = "Authentication required."
            });
        };

        options.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            ctx.Response.ContentType = "application/problem+json";
            return ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 403,
                Title = "Forbidden"
            });
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddProblemDetails();

if (builder.Environment.IsDevelopment())
    builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await ExerciseSeeder.SeedAsync(db);
}

app.Run();

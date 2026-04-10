using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api.Data.Seed;

public static class ExerciseSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Exercises.AnyAsync())
            return;

        var exercises = new List<Exercise>
        {
            new() { Name = "Bench Press", Category = "Chest" },
            new() { Name = "Incline Bench Press", Category = "Chest" },
            new() { Name = "Dumbbell Fly", Category = "Chest" },
            new() { Name = "Dip", Category = "Chest" },
            new() { Name = "Push-Up", Category = "Chest" },
            new() { Name = "Squat", Category = "Legs" },
            new() { Name = "Romanian Deadlift", Category = "Legs" },
            new() { Name = "Leg Press", Category = "Legs" },
            new() { Name = "Leg Curl", Category = "Legs" },
            new() { Name = "Leg Extension", Category = "Legs" },
            new() { Name = "Calf Raise", Category = "Legs" },
            new() { Name = "Deadlift", Category = "Back" },
            new() { Name = "Barbell Row", Category = "Back" },
            new() { Name = "Lat Pulldown", Category = "Back" },
            new() { Name = "Cable Row", Category = "Back" },
            new() { Name = "Pull-Up", Category = "Back" },
            new() { Name = "Overhead Press", Category = "Shoulders" },
            new() { Name = "Lateral Raise", Category = "Shoulders" },
            new() { Name = "Front Raise", Category = "Shoulders" },
            new() { Name = "Face Pull", Category = "Shoulders" },
            new() { Name = "Dumbbell Curl", Category = "Arms" },
            new() { Name = "Barbell Curl", Category = "Arms" },
            new() { Name = "Hammer Curl", Category = "Arms" },
            new() { Name = "Tricep Pushdown", Category = "Arms" },
            new() { Name = "Skull Crusher", Category = "Arms" },
            new() { Name = "Plank", Category = "Core" },
            new() { Name = "Crunch", Category = "Core" },
            new() { Name = "Cable Crunch", Category = "Core" },
        };

        db.Exercises.AddRange(exercises);
        await db.SaveChangesAsync();
    }
}

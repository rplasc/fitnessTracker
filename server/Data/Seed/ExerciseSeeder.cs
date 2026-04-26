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
            new() { Name = "Bench Press", Category = "Chest", Modality = "strength" },
            new() { Name = "Incline Bench Press", Category = "Chest", Modality = "strength" },
            new() { Name = "Dumbbell Fly", Category = "Chest", Modality = "strength" },
            new() { Name = "Dip", Category = "Chest", Modality = "strength" },
            new() { Name = "Push-Up", Category = "Chest", Modality = "strength" },
            new() { Name = "Squat", Category = "Legs", Modality = "strength" },
            new() { Name = "Romanian Deadlift", Category = "Legs", Modality = "strength" },
            new() { Name = "Leg Press", Category = "Legs", Modality = "strength" },
            new() { Name = "Leg Curl", Category = "Legs", Modality = "strength" },
            new() { Name = "Leg Extension", Category = "Legs", Modality = "strength" },
            new() { Name = "Calf Raise", Category = "Legs", Modality = "strength" },
            new() { Name = "Deadlift", Category = "Back", Modality = "strength" },
            new() { Name = "Barbell Row", Category = "Back", Modality = "strength" },
            new() { Name = "Lat Pulldown", Category = "Back", Modality = "strength" },
            new() { Name = "Cable Row", Category = "Back", Modality = "strength" },
            new() { Name = "Pull-Up", Category = "Back", Modality = "strength" },
            new() { Name = "Overhead Press", Category = "Shoulders", Modality = "strength" },
            new() { Name = "Lateral Raise", Category = "Shoulders", Modality = "strength" },
            new() { Name = "Front Raise", Category = "Shoulders", Modality = "strength" },
            new() { Name = "Face Pull", Category = "Shoulders", Modality = "strength" },
            new() { Name = "Dumbbell Curl", Category = "Arms", Modality = "strength" },
            new() { Name = "Barbell Curl", Category = "Arms", Modality = "strength" },
            new() { Name = "Hammer Curl", Category = "Arms", Modality = "strength" },
            new() { Name = "Tricep Pushdown", Category = "Arms", Modality = "strength" },
            new() { Name = "Skull Crusher", Category = "Arms", Modality = "strength" },
            new() { Name = "Plank", Category = "Core", Modality = "timed" },
            new() { Name = "Hollow Hold", Category = "Core", Modality = "timed" },
            new() { Name = "Crunch", Category = "Core", Modality = "strength" },
            new() { Name = "Cable Crunch", Category = "Core", Modality = "strength" },
            new() { Name = "Running", Category = "Cardio", Modality = "cardio" },
            new() { Name = "Cycling", Category = "Cardio", Modality = "cardio" },
            new() { Name = "Rowing", Category = "Cardio", Modality = "cardio" },
            new() { Name = "Walking", Category = "Cardio", Modality = "cardio" },
            new() { Name = "Swimming", Category = "Cardio", Modality = "cardio" },
            new() { Name = "Dead Hang", Category = "Back", Modality = "timed" },
        };

        db.Exercises.AddRange(exercises);
        await db.SaveChangesAsync();
    }
}

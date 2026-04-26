using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class WorkoutSetConfiguration : IEntityTypeConfiguration<WorkoutSet>
{
    public void Configure(EntityTypeBuilder<WorkoutSet> builder)
    {
        builder.ToTable("workout_set");
        builder.HasKey(ws => ws.Id);
        builder.Property(ws => ws.Id).HasColumnName("id");
        builder.Property(ws => ws.SessionId).HasColumnName("session_id");
        builder.Property(ws => ws.ExerciseId).HasColumnName("exercise_id");
        builder.Property(ws => ws.Reps).HasColumnName("reps");
        builder.Property(ws => ws.Weight).HasColumnName("weight");
        builder.Property(ws => ws.DurationSeconds).HasColumnName("duration_seconds");
        builder.Property(ws => ws.DistanceMeters).HasColumnName("distance_meters");
        builder.Property(ws => ws.SetNumber).HasColumnName("set_number").IsRequired();
        builder.Property(ws => ws.Rpe).HasColumnName("rpe");
        builder.Property(ws => ws.Notes).HasColumnName("notes").HasMaxLength(200);
        builder.Property(ws => ws.IsWarmup).HasColumnName("is_warmup").IsRequired().HasDefaultValue(false);

        builder.HasOne(ws => ws.Session)
            .WithMany(s => s.Sets)
            .HasForeignKey(ws => ws.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ws => ws.Exercise)
            .WithMany(e => e.WorkoutSets)
            .HasForeignKey(ws => ws.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class PlanExerciseConfiguration : IEntityTypeConfiguration<PlanExercise>
{
    public void Configure(EntityTypeBuilder<PlanExercise> builder)
    {
        builder.ToTable("plan_exercise");
        builder.HasKey(pe => pe.Id);
        builder.Property(pe => pe.Id).HasColumnName("id");
        builder.Property(pe => pe.PlanId).HasColumnName("plan_id");
        builder.Property(pe => pe.ExerciseId).HasColumnName("exercise_id");
        builder.Property(pe => pe.OrderIndex).HasColumnName("order_index");
        builder.Property(pe => pe.Sets).HasColumnName("sets");
        builder.Property(pe => pe.Reps).HasColumnName("reps");
        builder.Property(pe => pe.TargetWeight).HasColumnName("target_weight");
    }
}

using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("plan");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasColumnName("description").HasMaxLength(1000);
        builder.Property(p => p.Color).HasColumnName("color").HasMaxLength(20);

        builder.HasMany(p => p.Exercises)
            .WithOne(pe => pe.Plan)
            .HasForeignKey(pe => pe.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Schedules)
            .WithOne(s => s.Plan)
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class HealthMetricConfiguration : IEntityTypeConfiguration<HealthMetric>
{
    public void Configure(EntityTypeBuilder<HealthMetric> builder)
    {
        builder.ToTable("health_metric");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.UserId).HasColumnName("user_id");
        builder.Property(m => m.Date).HasColumnName("date").IsRequired()
            .HasConversion(
                d => d.ToString("yyyy-MM-dd"),
                s => DateOnly.Parse(s));
        builder.Property(m => m.BodyWeight).HasColumnName("body_weight").IsRequired();
        builder.Property(m => m.LoggedAt).HasColumnName("logged_at").IsRequired();

        builder.HasIndex(m => new { m.UserId, m.Date }).IsUnique();
    }
}

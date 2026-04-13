using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class SettingConfiguration : IEntityTypeConfiguration<Setting>
{
    public void Configure(EntityTypeBuilder<Setting> builder)
    {
        builder.ToTable("setting");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.UserId).HasColumnName("user_id");
        builder.Property(s => s.WeightUnit).HasColumnName("weight_unit").IsRequired()
            .HasMaxLength(2).HasDefaultValue("kg");
        builder.Property(s => s.HeightUnit).HasColumnName("height_unit").IsRequired()
            .HasMaxLength(2).HasDefaultValue("cm");
        builder.Property(s => s.HeightCm).HasColumnName("height_cm");
        builder.Property(s => s.OnboardingComplete).HasColumnName("onboarding_complete")
            .IsRequired().HasDefaultValue(false);
    }
}

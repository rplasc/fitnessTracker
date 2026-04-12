using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class ExerciseConfiguration : IEntityTypeConfiguration<Exercise>
{
    public void Configure(EntityTypeBuilder<Exercise> builder)
    {
        builder.ToTable("exercise");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.UserId).HasColumnName("user_id");
        builder.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
        builder.Property(e => e.Category).HasColumnName("category").IsRequired().HasMaxLength(100);
        builder.Property(e => e.IsCustom).HasColumnName("is_custom").HasDefaultValue(false);

        // Uniqueness enforced in code: name must be unique per user + global exercises
        builder.HasIndex(e => e.Name);
    }
}

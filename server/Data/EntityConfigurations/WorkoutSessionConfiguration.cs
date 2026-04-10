using FitTrack.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FitTrack.Api.Data.EntityConfigurations;

public class WorkoutSessionConfiguration : IEntityTypeConfiguration<WorkoutSession>
{
    public void Configure(EntityTypeBuilder<WorkoutSession> builder)
    {
        builder.ToTable("workout_session");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.StartedAt).HasColumnName("started_at").IsRequired();
        builder.Property(s => s.FinishedAt).HasColumnName("finished_at");
        builder.Property(s => s.Notes).HasColumnName("notes").HasMaxLength(2000);

        builder.HasMany(s => s.Sets)
            .WithOne(ws => ws.Session)
            .HasForeignKey(ws => ws.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGoalsToSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "target_weight_kg",
                table: "setting",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "weekly_workout_goal",
                table: "setting",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "target_weight_kg",
                table: "setting");

            migrationBuilder.DropColumn(
                name: "weekly_workout_goal",
                table: "setting");
        }
    }
}

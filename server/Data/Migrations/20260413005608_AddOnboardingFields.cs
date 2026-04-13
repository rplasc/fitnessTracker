using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "display_name",
                table: "user",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "height_cm",
                table: "setting",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "onboarding_complete",
                table: "setting",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "display_name",
                table: "user");

            migrationBuilder.DropColumn(
                name: "height_cm",
                table: "setting");

            migrationBuilder.DropColumn(
                name: "onboarding_complete",
                table: "setting");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseModalities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<double>(
                name: "weight",
                table: "workout_set",
                type: "REAL",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "REAL");

            migrationBuilder.AlterColumn<int>(
                name: "reps",
                table: "workout_set",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<double>(
                name: "distance_meters",
                table: "workout_set",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duration_seconds",
                table: "workout_set",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "modality",
                table: "exercise",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "strength");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "distance_meters",
                table: "workout_set");

            migrationBuilder.DropColumn(
                name: "duration_seconds",
                table: "workout_set");

            migrationBuilder.DropColumn(
                name: "modality",
                table: "exercise");

            migrationBuilder.AlterColumn<double>(
                name: "weight",
                table: "workout_set",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "REAL",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "reps",
                table: "workout_set",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);
        }
    }
}

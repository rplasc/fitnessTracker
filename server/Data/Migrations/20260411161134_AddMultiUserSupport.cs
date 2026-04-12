using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiUserSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_schedule_day_of_week",
                table: "schedule");

            migrationBuilder.DropIndex(
                name: "IX_health_metric_date",
                table: "health_metric");

            migrationBuilder.DropIndex(
                name: "IX_exercise_name",
                table: "exercise");

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "workout_session",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "setting",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "schedule",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "plan",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "health_metric",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "user_id",
                table: "exercise",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    username = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_workout_session_user_id",
                table: "workout_session",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_setting_user_id",
                table: "setting",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_schedule_user_id_day_of_week",
                table: "schedule",
                columns: new[] { "user_id", "day_of_week" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_plan_user_id",
                table: "plan",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_health_metric_user_id_date",
                table: "health_metric",
                columns: new[] { "user_id", "date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_exercise_name",
                table: "exercise",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_exercise_user_id",
                table: "exercise",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_username",
                table: "user",
                column: "username",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_exercise_user_user_id",
                table: "exercise",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_health_metric_user_user_id",
                table: "health_metric",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_plan_user_user_id",
                table: "plan",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_schedule_user_user_id",
                table: "schedule",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_setting_user_user_id",
                table: "setting",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_session_user_user_id",
                table: "workout_session",
                column: "user_id",
                principalTable: "user",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_exercise_user_user_id",
                table: "exercise");

            migrationBuilder.DropForeignKey(
                name: "FK_health_metric_user_user_id",
                table: "health_metric");

            migrationBuilder.DropForeignKey(
                name: "FK_plan_user_user_id",
                table: "plan");

            migrationBuilder.DropForeignKey(
                name: "FK_schedule_user_user_id",
                table: "schedule");

            migrationBuilder.DropForeignKey(
                name: "FK_setting_user_user_id",
                table: "setting");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_session_user_user_id",
                table: "workout_session");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropIndex(
                name: "IX_workout_session_user_id",
                table: "workout_session");

            migrationBuilder.DropIndex(
                name: "IX_setting_user_id",
                table: "setting");

            migrationBuilder.DropIndex(
                name: "IX_schedule_user_id_day_of_week",
                table: "schedule");

            migrationBuilder.DropIndex(
                name: "IX_plan_user_id",
                table: "plan");

            migrationBuilder.DropIndex(
                name: "IX_health_metric_user_id_date",
                table: "health_metric");

            migrationBuilder.DropIndex(
                name: "IX_exercise_name",
                table: "exercise");

            migrationBuilder.DropIndex(
                name: "IX_exercise_user_id",
                table: "exercise");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "workout_session");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "setting");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "schedule");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "plan");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "health_metric");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "exercise");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_day_of_week",
                table: "schedule",
                column: "day_of_week",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_health_metric_date",
                table: "health_metric",
                column: "date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_exercise_name",
                table: "exercise",
                column: "name",
                unique: true);
        }
    }
}

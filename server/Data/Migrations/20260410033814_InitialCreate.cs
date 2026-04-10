using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "exercise",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    category = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    is_custom = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercise", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "health_metric",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    date = table.Column<string>(type: "TEXT", nullable: false),
                    body_weight = table.Column<double>(type: "REAL", nullable: false),
                    logged_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_health_metric", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "plan",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    color = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plan", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "setting",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    weight_unit = table.Column<string>(type: "TEXT", maxLength: 2, nullable: false, defaultValue: "kg")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_setting", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "workout_session",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    started_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    finished_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_session", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "plan_exercise",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    plan_id = table.Column<int>(type: "INTEGER", nullable: false),
                    exercise_id = table.Column<int>(type: "INTEGER", nullable: false),
                    order_index = table.Column<int>(type: "INTEGER", nullable: false),
                    sets = table.Column<int>(type: "INTEGER", nullable: false),
                    reps = table.Column<int>(type: "INTEGER", nullable: false),
                    target_weight = table.Column<double>(type: "REAL", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plan_exercise", x => x.id);
                    table.ForeignKey(
                        name: "FK_plan_exercise_exercise_exercise_id",
                        column: x => x.exercise_id,
                        principalTable: "exercise",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_plan_exercise_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedule",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    day_of_week = table.Column<int>(type: "INTEGER", nullable: false),
                    plan_id = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedule", x => x.id);
                    table.ForeignKey(
                        name: "FK_schedule_plan_plan_id",
                        column: x => x.plan_id,
                        principalTable: "plan",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "workout_set",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    session_id = table.Column<int>(type: "INTEGER", nullable: false),
                    exercise_id = table.Column<int>(type: "INTEGER", nullable: false),
                    reps = table.Column<int>(type: "INTEGER", nullable: false),
                    weight = table.Column<double>(type: "REAL", nullable: false),
                    set_number = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_set", x => x.id);
                    table.ForeignKey(
                        name: "FK_workout_set_exercise_exercise_id",
                        column: x => x.exercise_id,
                        principalTable: "exercise",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_workout_set_workout_session_session_id",
                        column: x => x.session_id,
                        principalTable: "workout_session",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exercise_name",
                table: "exercise",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_health_metric_date",
                table: "health_metric",
                column: "date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_plan_exercise_exercise_id",
                table: "plan_exercise",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "IX_plan_exercise_plan_id",
                table: "plan_exercise",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_day_of_week",
                table: "schedule",
                column: "day_of_week",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_schedule_plan_id",
                table: "schedule",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_workout_set_exercise_id",
                table: "workout_set",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "IX_workout_set_session_id",
                table: "workout_set",
                column: "session_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "health_metric");

            migrationBuilder.DropTable(
                name: "plan_exercise");

            migrationBuilder.DropTable(
                name: "schedule");

            migrationBuilder.DropTable(
                name: "setting");

            migrationBuilder.DropTable(
                name: "workout_set");

            migrationBuilder.DropTable(
                name: "plan");

            migrationBuilder.DropTable(
                name: "exercise");

            migrationBuilder.DropTable(
                name: "workout_session");
        }
    }
}

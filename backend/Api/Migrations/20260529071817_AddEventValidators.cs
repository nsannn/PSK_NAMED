using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventValidators : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventValidators",
                columns: table => new
                {
                    AssignedEventsId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedValidatorsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventValidators", x => new { x.AssignedEventsId, x.AssignedValidatorsId });
                    table.ForeignKey(
                        name: "FK_EventValidators_Events_AssignedEventsId",
                        column: x => x.AssignedEventsId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventValidators_Users_AssignedValidatorsId",
                        column: x => x.AssignedValidatorsId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventValidators_AssignedValidatorsId",
                table: "EventValidators",
                column: "AssignedValidatorsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventValidators");
        }
    }
}

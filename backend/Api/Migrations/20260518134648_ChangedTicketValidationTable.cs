using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class ChangedTicketValidationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchasedTickets_Events_EventId",
                table: "PurchasedTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchasedTickets_Tickets_TicketId",
                table: "PurchasedTickets");

            migrationBuilder.AddColumn<DateTime>(
                name: "EventDateSnapshot",
                table: "PurchasedTickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EventNameSnapshot",
                table: "PurchasedTickets",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchasedTickets_Events_EventId",
                table: "PurchasedTickets",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchasedTickets_Tickets_TicketId",
                table: "PurchasedTickets",
                column: "TicketId",
                principalTable: "Tickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchasedTickets_Events_EventId",
                table: "PurchasedTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchasedTickets_Tickets_TicketId",
                table: "PurchasedTickets");

            migrationBuilder.DropColumn(
                name: "EventDateSnapshot",
                table: "PurchasedTickets");

            migrationBuilder.DropColumn(
                name: "EventNameSnapshot",
                table: "PurchasedTickets");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchasedTickets_Events_EventId",
                table: "PurchasedTickets",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchasedTickets_Tickets_TicketId",
                table: "PurchasedTickets",
                column: "TicketId",
                principalTable: "Tickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

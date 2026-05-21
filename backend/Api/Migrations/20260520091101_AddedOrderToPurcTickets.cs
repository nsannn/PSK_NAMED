using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddedOrderToPurcTickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "PurchasedTickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchasedTickets_OrderId",
                table: "PurchasedTickets",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchasedTickets_Orders_OrderId",
                table: "PurchasedTickets",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchasedTickets_Orders_OrderId",
                table: "PurchasedTickets");

            migrationBuilder.DropIndex(
                name: "IX_PurchasedTickets_OrderId",
                table: "PurchasedTickets");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "PurchasedTickets");
        }
    }
}

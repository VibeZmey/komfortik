using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flights.Migrations
{
    /// <inheritdoc />
    public partial class updatebooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flight",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Flight",
                table: "Bookings",
                column: "FlightId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flight",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Flight",
                table: "Bookings",
                column: "FlightId",
                unique: true);
        }
    }
}

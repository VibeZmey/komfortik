using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flights.Migrations
{
    /// <inheritdoc />
    public partial class removeindexfrombooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flight_Seat",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Flight",
                table: "Bookings",
                column: "FlightId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flight",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Flight_Seat",
                table: "Bookings",
                columns: new[] { "FlightId", "SeatNumber" },
                unique: true);
        }
    }
}

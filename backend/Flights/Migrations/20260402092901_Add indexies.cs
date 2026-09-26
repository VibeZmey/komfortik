using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flights.Migrations
{
    /// <inheritdoc />
    public partial class Addindexies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flights_FromAirportId",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_FlightId",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_Route_Date",
                table: "Flights",
                columns: new[] { "FromAirportId", "ToAirportId", "DepartureTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Flight_Seat",
                table: "Bookings",
                columns: new[] { "FlightId", "SeatNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flights_Route_Date",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flight_Seat",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Flights_FromAirportId",
                table: "Flights",
                column: "FromAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_FlightId",
                table: "Bookings",
                column: "FlightId");
        }
    }
}

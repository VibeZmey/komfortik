using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flights.Migrations
{
    /// <inheritdoc />
    public partial class UpgradeFlightmodel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SeatColumn",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SeatRow",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "ColumnsPerRow",
                table: "Airplanes",
                newName: "Columns");

            migrationBuilder.RenameColumn(
                name: "BuisnessColumnsPerRow",
                table: "Airplanes",
                newName: "BuisnessColumns");

            migrationBuilder.AddColumn<int>(
                name: "BookedBusinessSeats",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BookedSeats",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BusinessSeats",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalSeats",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BookedBusinessSeats",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "BookedSeats",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "BusinessSeats",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "TotalSeats",
                table: "Flights");

            migrationBuilder.RenameColumn(
                name: "Columns",
                table: "Airplanes",
                newName: "ColumnsPerRow");

            migrationBuilder.RenameColumn(
                name: "BuisnessColumns",
                table: "Airplanes",
                newName: "BuisnessColumnsPerRow");

            migrationBuilder.AddColumn<int>(
                name: "SeatColumn",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SeatRow",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}

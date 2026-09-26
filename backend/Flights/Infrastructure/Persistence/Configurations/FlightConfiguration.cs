using Flights.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Flights.Infrastructure.Persistence.Configurations;

public class FlightConfiguration : IEntityTypeConfiguration<Flight>
{
    public void Configure(EntityTypeBuilder<Flight> builder)
    {
        builder.HasKey(f => f.Id);
        
        builder
            .HasIndex(f => 
                new { f.FromAirportId, f.ToAirportId, f.DepartureTime })
            .HasDatabaseName("IX_Flights_Route_Date");

        builder
            .HasOne(f => f.FromAirport)
            .WithMany(a => a.DepartingFlights)
            .HasForeignKey(f => f.FromAirportId);

        builder
            .HasOne(f => f.ToAirport)
            .WithMany(a => a.ArrivingFlights)
            .HasForeignKey(f => f.ToAirportId);
        
        builder
            .HasMany(f => f.Bookings)
            .WithOne(b => b.Flight)
            .HasForeignKey(b => b.FlightId);
        
        builder
            .HasOne(f => f.Airplane)
            .WithMany(a => a.Flights)
            .HasForeignKey(a => a.AirplaneId);
    }
}
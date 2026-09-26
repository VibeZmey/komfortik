using Flights.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Flights.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder
            .HasIndex(b => b.FlightId) 
            .HasDatabaseName("IX_Flight");  
        
        builder
            .HasIndex(b => b.OrderId)
            .HasDatabaseName("IX_Order");
        
        builder.HasKey(b => b.Id);
    }
}
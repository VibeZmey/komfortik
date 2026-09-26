using Flights.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Flights.Infrastructure.Persistence.Configurations;

public class PassengerConfiguration : IEntityTypeConfiguration<Passenger>
{
    public void Configure(EntityTypeBuilder<Passenger> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.HasMany(p => p.Documents)
            .WithOne(p => p.Passenger)
            .HasForeignKey(p => p.PassengerId);
        
        builder
            .HasMany(p => p.Bookings)
            .WithOne(p => p.Passenger)
            .HasForeignKey(p => p.PassengerId);
    }
}
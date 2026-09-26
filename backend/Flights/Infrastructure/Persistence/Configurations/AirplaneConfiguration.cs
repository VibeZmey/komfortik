using Flights.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Flights.Infrastructure.Persistence.Configurations;

public class AirplaneConfiguration : IEntityTypeConfiguration<Airplane>
{
    public void Configure(EntityTypeBuilder<Airplane> builder)
    {
        builder.HasKey(a => a.Id);
        
        builder.Property(f => f.TotalSeats)
            .HasComputedColumnSql($"\"Rows\" * \"Columns\"", stored: true);
        
        builder
            .HasOne(a => a.Airline)
            .WithMany(a => a.Airplanes)
            .HasForeignKey(a => a.AirlineId);
    }
}
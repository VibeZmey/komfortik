using Flights.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Flights.Infrastructure.Persistence.Configurations;

public class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.HasKey(o => o.Id);
        
        builder.Property(e => e.Data)
            .HasColumnType("jsonb");
        
        builder.HasIndex(e => new { e.Processed, e.OccurredOn })
            .HasDatabaseName("IX_OutboxMessages_Processed_OccurredOn");
    }
}
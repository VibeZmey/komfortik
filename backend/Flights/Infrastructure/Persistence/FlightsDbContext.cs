using Flights.Application.Common.Interfaces;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Persistence;

public class FlightsDbContext : DbContext
{
    public DbSet<Passenger> Passengers { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<Flight> Flights { get; set; }
    public DbSet<Airport> Airports { get; set; }
    public DbSet<Airline> Airlines { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Airplane> Airplanes { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<OutboxMessage> OutboxMessages { get; set; }
    public DbSet<Order> Orders { get; set; }
    public FlightsDbContext(DbContextOptions<FlightsDbContext> options) 
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new AirlineConfiguration());
        modelBuilder.ApplyConfiguration(new AirplaneConfiguration());
        modelBuilder.ApplyConfiguration(new AirportConfiguration());
        modelBuilder.ApplyConfiguration(new BookingConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentConfiguration());
        modelBuilder.ApplyConfiguration(new FlightConfiguration());
        modelBuilder.ApplyConfiguration(new PassengerConfiguration());
        modelBuilder.ApplyConfiguration(new NotificationConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxMessageConfiguration());
        
        base.OnModelCreating(modelBuilder);
    }
}

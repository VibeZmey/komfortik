using Flights.Application.Common.Interfaces;
using Flights.Domain.Interfaces;
using Flights.Infrastructure.Options;
using Flights.Infrastructure.Persistence;
using Flights.Infrastructure.Repositories;
using Flights.Infrastructure.Services;
using Flights.Infrastructure.Workers;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<FlightsDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Postgres")));
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration.GetConnectionString("Redis");
        });
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IPassengerRepository, PassengerRepository>();
        services.AddScoped<IEncryptionService, EncryptionService>();
        services.AddScoped<IFlightRepository, FlightRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddHostedService<UpdateFlightStatusWorker>();
        //services.AddHostedService<OutboxWorker>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IAirportRepository, AirportRepository>();
        
        services.Configure<RabbitMqSettings>(configuration.GetSection("RabbitMq"));
        return services;
    }
}
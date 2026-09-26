using Flights.Domain.Models;
using Flights.Infrastructure.Persistence;
using GeoTimeZone;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;

namespace Flights.Presentation.Controllers;

[ApiController]
[AllowAnonymous]
[Route("test")]
public class TestController
{
    public FlightsDbContext _context;
    
    public TestController(FlightsDbContext dbContext)
    {
        _context = dbContext;
    }

    [HttpPost("import-flights")]
    public async Task ImportFlights()
    {
        var csvPath = "/app/data/airportsdata.csv";

        var connectionString = _context.Database.GetConnectionString();

        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        using var reader = new StreamReader(csvPath);

        var header = await reader.ReadLineAsync();

        await using var writer = await conn.BeginTextImportAsync(
            "COPY \"Airports\" (\"Id\", \"Code\", \"Latitude\", \"Longitude\", \"City\", \"CountryName\", \"CountryCode\", \"TimezoneOffset\") FROM STDIN WITH (FORMAT CSV)");

        var lineCount = 0;
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line))
                continue;

            await writer.WriteLineAsync(line);
            lineCount++;
        }
    }

    [HttpPost("settimezoneoffset")]
    public async Task SetTimezoneOffsetSettings()
    {
        var res = await _context.Airports.ToListAsync();
        foreach(var i in res)
        {
            string timeZoneId = TimeZoneLookup.GetTimeZone(i.Latitude, i.Longitude).Result;
            var timeZone = DateTimeZoneProviders.Tzdb[timeZoneId];
            var now = SystemClock.Instance.GetCurrentInstant();
            var offset = timeZone.GetUtcOffset(now);
            i.TimezoneOffset = (int)offset.ToTimeSpan().TotalHours;
        }
        await _context.SaveChangesAsync();
    }

    [HttpPost("airline")]
    public async Task CreateAirline(int id, string name, double coef)
    {
        await _context.Airlines.AddAsync(new Airline(){Id = id, Name = name, Coefficient = coef});
        await _context.SaveChangesAsync();
    }
    
    [HttpPost("airplane")]
    public async Task CreateAirplane(int Id, string Name, int Rows, int Columns, int BuisnessRows, int BuisnessColumns,int SpacePlusRow,int AirlineId)
    {
        await _context.Airplanes.AddAsync(new Airplane()
        {
            Id = Id,
            Name = Name,
            Rows = Rows,
            Columns = Columns,
            BuisnessRows = BuisnessRows,
            BuisnessColumns = BuisnessColumns,
            SpacePlusRow = SpacePlusRow,
            AirlineId = AirlineId
        });
        await _context.SaveChangesAsync();
    }
    
    [HttpPost("flights")]
    public async Task GenerateFlights(int count, string country, string? fromCity, string? toCity, DateTime from, DateTime to, int minuteStep = 60)
    {
        var airplanes = _context.Airplanes.Include(a => a.Airline).ToList();
        
        for (int i = 0; i < count; i++)
        {
            var allAirportsInCountry = await _context.Airports
                .Where(p => p.CountryName == country)
                .ToListAsync();
            
            if (allAirportsInCountry.Count == 0) continue;

            List<Airport> fromAirports;
            List<Airport> toAirports;
            
            if (fromCity is null)
            {
                fromAirports = allAirportsInCountry;
            }
            else
            {
                fromAirports = allAirportsInCountry
                    .Where(p => p.City == fromCity)
                    .ToList();
            }
            
            if (toCity is null)
            {
                toAirports = allAirportsInCountry;
            }
            else
            {
                toAirports = allAirportsInCountry
                    .Where(p => p.City == toCity)
                    .ToList();
            }
            
            if (fromAirports.Count == 0 || toAirports.Count == 0) continue;
            
            var ap1 = fromAirports[Random.Shared.Next(0, fromAirports.Count)];
            var ap2 = toAirports[Random.Shared.Next(0, toAirports.Count)];
            
            if (ap1.Id == ap2.Id) continue;

            var dist = Test.CalculateDistance(ap1.Latitude, ap1.Longitude, ap2.Latitude, ap2.Longitude);
            var cruiseSpeed = 800; 
            var takeoffLandingTime = 30; 
            var baseDuration = (int)((dist / cruiseSpeed) * 60) + takeoffLandingTime;
            
            if (baseDuration < 45) continue;

            var depUtc = Test.GenerateRoundedDateTimeUtc(from, to, minuteStep);
            var durationVariation = Random.Shared.Next(-15, 16);
            var actualDuration = Math.Max(baseDuration + durationVariation, 45);
            var arrUtc = depUtc.AddMinutes(actualDuration);

            decimal basePrice = dist switch
            {
                < 1500 => ((decimal)dist) / 15,
                < 3000 => ((decimal)dist) / 12,
                < 5000 => ((decimal)dist) / 7,
                _      => ((decimal)dist) / 5
            };

            var airline = airplanes[Random.Shared.Next(0, airplanes.Count)];
            var priceWithAirline = Math.Round(basePrice * (decimal)airline.Airline.Coefficient, 2);
            
            var peakHourMultiplier = Test.GetPeakHourMultiplier(depUtc.Hour);
            var demandVariation = Random.Shared.Next(80, 121) / 100m;
            var finalFlightPrice = Math.Round(priceWithAirline * peakHourMultiplier * demandVariation, 2);
            
            var luggagePrice = Math.Round(((decimal)dist / 3000) + Random.Shared.Next(15, 40), 2);
            var foodPrice = Random.Shared.Next(8, 25);
            var businessMultiplier = 1.8m + (decimal)Random.Shared.Next(0, 30) / 100;
            var businessPrice = Math.Round(finalFlightPrice * businessMultiplier, 2);
            
            var totalSeats = airline.Rows * airline.Columns;
            var businessSeats = airline.BuisnessRows * airline.BuisnessColumns;

            var flight = new Flight
            {
                Id = Guid.NewGuid(),
                Number = $"{airline.Airline.Name.Substring(0, 2).ToUpper()}{Random.Shared.Next(100, 10000)}",
                FromAirportId = ap1.Id,
                ToAirportId = ap2.Id,
                DurationMins = actualDuration,
                DepartureTime = depUtc,
                ArrivalTime = arrUtc,
                FlightPrice = finalFlightPrice*80,
                LuggagePrice = luggagePrice*80,
                BusinessPrice = businessPrice*80,
                FoodPrice = foodPrice*80,
                Status = FlightStatus.Scheduled,
                AirplaneId = airline.Id,
                TotalSeats = totalSeats,
                BusinessSeats = businessSeats,
            };

            await _context.Flights.AddAsync(flight);
        }

        await _context.SaveChangesAsync();
    }

    [HttpDelete("flights")]
    public async Task DeleteFlights()
    {
        _context.Flights.RemoveRange(_context.Flights);
        await _context.SaveChangesAsync();
    }

    [HttpDelete("outbox")]
    public async Task DeleteOutbox()
    {
        _context.OutboxMessages.RemoveRange(_context.OutboxMessages);
        await _context.SaveChangesAsync();
    }

    [HttpDelete("notifications")]
    public async Task DeleteNotifications()
    {
        _context.Notifications.RemoveRange(_context.Notifications);
        await _context.SaveChangesAsync();
    }
    
    [HttpDelete("orders")]
    public async Task DeleteOrders()
    {
        _context.Orders.RemoveRange(_context.Orders);
        await _context.SaveChangesAsync();
    }
}

public class Test
{
    private static readonly Random random = new Random();
    
    public static DateTime GenerateRoundedDateTimeUtc(
        DateTime minDateUtc, 
        DateTime maxDateUtc, 
        int minuteStep = 60)
    {
        if (minDateUtc.Kind != DateTimeKind.Utc) minDateUtc = minDateUtc.ToUniversalTime();
        if (maxDateUtc.Kind != DateTimeKind.Utc) maxDateUtc = maxDateUtc.ToUniversalTime();
    
        var date = minDateUtc.AddDays(Random.Shared.Next(0, (maxDateUtc - minDateUtc).Days + 1));
        var hour = Random.Shared.Next(0, 24);
        var minute = Random.Shared.Next(0, 60 / minuteStep) * minuteStep;
    
        return new DateTime(date.Year, date.Month, date.Day, hour, minute, 0, DateTimeKind.Utc);
    }
    
    public static async Task<Airport> GenerateAirportId(FlightsDbContext _context, string? country)
    {
        var count = await _context.Airports
            .CountAsync(p => p.CountryName == country);
    
        var skip = Random.Shared.Next(0, count);
    
        return await _context.Airports
            .Where(p => p.CountryName == country)
            .Skip(skip)
            .FirstOrDefaultAsync();
    }
    
    private const double EarthRadiusKm = 6371.0;
    
    public static double CalculateDistance(
        double lat1, double lon1, 
        double lat2, double lon2)
    {
        var lat1Rad = ToRadians(lat1);
        var lat2Rad = ToRadians(lat2);
        var deltaLat = ToRadians(lat2 - lat1);
        var deltaLon = ToRadians(lon2 - lon1);
        
        var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);
        
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        
        return EarthRadiusKm * c;
    }
    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
    
    public static decimal GetPeakHourMultiplier(int hour)
    {
        return hour switch
        {
            >= 6 and < 9 => 1.3m,
            >= 9 and < 12 => 1.1m,
            >= 12 and < 14 => 1.0m,
            >= 14 and < 17 => 1.05m,
            >= 17 and < 20 => 1.25m,
            >= 20 and < 22 => 1.15m,
            _ => 0.85m
        };
    }

}
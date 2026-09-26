using Flights.Application.Common.Interfaces;
using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using Flights.Infrastructure.Common;
using Flights.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Repositories;

public class FlightRepository : IFlightRepository
{
    private readonly FlightsDbContext _context;
    private readonly ICacheService _cacheService;

    public FlightRepository(
        FlightsDbContext context,
        ICacheService cacheService)
    {
        _cacheService = cacheService;
        _context = context;
    }
    
    public async Task<IReadOnlyCollection<GetFlightsByFilterDto>> GetFlightsByFilterAsync(SearchFlightsQuery query, CancellationToken ct = default)
    {
        var originAirports = await _cacheService.GetAsync<List<int>>
            (CacheKeys.AirportsByCityKey(query.OriginCity), ct);
        
        if (originAirports is null || originAirports.Count == 0)
        {
            originAirports = await _context.Airports
                .Where(a => 
                    a.City == query.OriginCity)
                .Select(a => a.Id)
                .ToListAsync(ct);
            await _cacheService.SetAsync(
                CacheKeys.AirportsByCityKey(query.OriginCity), 
                originAirports, TimeSpan.FromHours(24), ct);
        }
        
        var destAirports = await _cacheService.GetAsync<List<int>>
            (CacheKeys.AirportsByCityKey(query.DestinationCity), ct);
        
        if (destAirports is null || destAirports.Count == 0)
        {
            destAirports = await _context.Airports
                .Where(a => 
                    a.City == query.DestinationCity)
                .Select(a => a.Id)
                .ToListAsync(ct);
            await _cacheService.SetAsync(
                CacheKeys.AirportsByCityKey(query.DestinationCity), 
                destAirports, TimeSpan.FromHours(24), ct);
        }
        
        if (originAirports.Count == 0 || destAirports.Count == 0) 
            return Array.Empty<GetFlightsByFilterDto>();
        
        var baseQuery = _context.Flights.AsNoTracking()
            .Where(f => 
                originAirports.Contains(f.FromAirportId) && 
                destAirports.Contains(f.ToAirportId))
            .Where(f => f.Status == FlightStatus.Scheduled)
            .Include(f => f.ToAirport)
            .Include(f => f.FromAirport)
            .Include(f => f.Airplane.Airline);

        var totalPassengers = query.Adults + query.Kids;
        
        var outboundQuery = baseQuery
            .Where(f =>
                f.DepartureTime.AddHours(f.FromAirport.TimezoneOffset).Date == query.DepartureDate.Date)
            .Where(f =>
                (f.TotalSeats - f.BookedSeats) >= totalPassengers)
            .Where(f =>
                !query.IsBusinessOnly ||
                (f.BusinessSeats - f.BookedBusinessSeats) >= totalPassengers);
        
        if (query.DepartureHourFrom.HasValue)
            outboundQuery = outboundQuery
                .Where(f => 
                    f.DepartureTime.AddHours(f.FromAirport.TimezoneOffset).Hour >= query.DepartureHourFrom.Value);
        if (query.DepartureHourTo.HasValue)
            outboundQuery = outboundQuery
                .Where(f => 
                    f.DepartureTime.AddHours(f.ToAirport.TimezoneOffset).Hour <= query.DepartureHourTo.Value);

        if (query.MaxTotalPrice.HasValue)
        {
            outboundQuery = outboundQuery.Where(f => 
                (query.IsBusinessOnly ? 
                    f.FlightPrice+f.BusinessPrice <= query.MaxTotalPrice.Value : 
                    f.FlightPrice <= query.MaxTotalPrice.Value)); 
        }
        
        
        var outboundFlights = await outboundQuery
            .OrderBy(f => f.FlightPrice)
            .Take(query.PageSize * 3)
            .ToListAsync(ct);

        List<Flight> returnFlights = null;
        if (query.ReturnDate.HasValue)
        {
            var returnBaseQuery = _context.Flights.AsNoTracking()
                .Where(f => 
                    destAirports.Contains(f.FromAirportId) && 
                    originAirports.Contains(f.ToAirportId))
                .Where(f => f.Status == FlightStatus.Scheduled)
                .Include(f => f.ToAirport)
                .Include(f => f.FromAirport)
                .Include(f => f.Airplane.Airline);

            returnFlights = await returnBaseQuery
                .Where(f => f.DepartureTime.AddHours(f.FromAirport.TimezoneOffset).Date == query.ReturnDate.Value.Date)
                .Take(query.PageSize * 3)
                .ToListAsync(ct);
        }
        
        var result = new List<GetFlightsByFilterDto>();

        foreach (var outFlight in outboundFlights)
        {
            if (query.ReturnDate.HasValue && returnFlights is not null && returnFlights.Count != 0)
            {
                foreach (var retFlight in returnFlights)
                {
                    var outboundFlight = Flight.ToFlightSegment(outFlight);
                    var returnFlight = Flight.ToFlightSegment(retFlight);
                    
                    var outboundPrice = query.IsBusinessOnly ?
                        outboundFlight.FlightPrice + outboundFlight.BusinessPrice :
                        outboundFlight.FlightPrice;
                    
                    var returnPrice = query.IsBusinessOnly ?
                        returnFlight.FlightPrice + returnFlight.BusinessPrice :
                        returnFlight.FlightPrice;
                    
                    var totalPrice = (outboundPrice + returnPrice)*query.Adults +
                                 (outboundPrice + returnPrice)*query.Kids/2;
                    
                    result.Add(new GetFlightsByFilterDto
                    {
                        Outbound = outboundFlight,
                        Return = returnFlight,
                        TotalPrice = totalPrice
                    });
                }
            }
            else
            {
                var outboundFlight = Flight.ToFlightSegment(outFlight);
                
                var outboundPrice = query.IsBusinessOnly ?
                    outboundFlight.FlightPrice + outboundFlight.BusinessPrice :
                    outboundFlight.FlightPrice;
                
                var totalPrice = outboundPrice*query.Adults +
                                 outboundPrice*query.Kids/2;
                
                result.Add(new GetFlightsByFilterDto
                {
                    Outbound = Flight.ToFlightSegment(outFlight),
                    Return = null,
                    TotalPrice = totalPrice
                });
            }
        }
        
        result = query.SortBy switch
        {
            FlightSortField.Price => query.SortDirection == SortDirection.Ascending
                ? result.OrderBy(f => f.TotalPrice).ToList()
                : result.OrderByDescending(f => f.TotalPrice).ToList(),
                
            FlightSortField.DepartureTime => query.SortDirection == SortDirection.Ascending
                ? result.OrderBy(f => f.Outbound.DepartureTime).ToList()
                : result.OrderByDescending(f => f.Outbound.DepartureTime).ToList(),
                
            FlightSortField.ArrivalTime => query.SortDirection == SortDirection.Ascending
                ? result.OrderBy(f => f.Outbound.ArrivalTime).ToList()
                : result.OrderByDescending(f => f.Outbound.ArrivalTime).ToList(),
                
            FlightSortField.Duration => query.SortDirection == SortDirection.Ascending
                ? result.OrderBy(f => f.Outbound.DurationMins).ToList()
                : result.OrderByDescending(f => f.Outbound.DurationMins).ToList(),
                
            _ => result.OrderBy(f => f.TotalPrice).ToList()
        };
        
        return result
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();
    }
    
    public async Task<HashSet<Guid>> GetUserIdsByFlightIdAsync(Guid flightId, CancellationToken ct = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Where(b => b.FlightId == flightId)
            .Select(b => b.UserId)
            .Distinct()
            .ToHashSetAsync(ct);
    }

    //функция возвращает нам рейсы в которых уже возможно изменение их статуса,
    //довольно грубо отсекается часть рейсов чтобы не делать сложных запрос к базе,
    //более детальная проверка реализована в Domain
    public async Task<IReadOnlyCollection<Flight>> GetFlightsReadyForTimeTransitionsAsync(
        DateTime now, 
        CancellationToken ct = default)
    {
        return await _context.Flights
            .Where(f => f.Status == FlightStatus.Scheduled || f.Status == FlightStatus.CheckIn)
            .Where(f => f.DepartureTime <= now.AddHours(24))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyCollection<Guid>?> GetUsersIdsByFlightIdAsync(Guid id, CancellationToken ct = default)
    {
        var flight = await _context.Flights
            .Include(f => f.Bookings)
            .FirstOrDefaultAsync(f => f.Id == id, ct);
        
        return flight?.Bookings.Select(b => b.UserId).ToList();
    }

    public async Task<Flight?> GetByIdAsync(Guid flightId, CancellationToken ct = default)
    {
        return await _context.Flights
            .FirstOrDefaultAsync(f => f.Id == flightId, ct);
    }

    public async Task<Flight?> GetByIdWithDetailsAsync(Guid flightId, CancellationToken ct = default)
    {
        return await _context
            .Flights
            .Include(f => f.Airplane)
            .Include(f => f.ToAirport)
            .Include(f => f.FromAirport)
            .Include(f => f.Bookings)
            .FirstOrDefaultAsync(f => f.Id == flightId, ct);
    }
}
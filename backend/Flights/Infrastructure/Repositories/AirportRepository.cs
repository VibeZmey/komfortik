using Flights.Application.Common.Interfaces;
using Flights.Domain.Interfaces;
using Flights.Infrastructure.Common;
using Flights.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Repositories;

public class AirportRepository : IAirportRepository
{
    private readonly FlightsDbContext _context;
    private readonly ICacheService _cacheService;

    public AirportRepository(
        ICacheService cacheService,
        FlightsDbContext context)
    {
        _context = context;
        _cacheService = cacheService;
    }
    
    public async Task<List<string>> GetCitiesByPrefix(string prefix, int take, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            return new List<string>(0);
        
        var cities = await _cacheService
            .GetAsync<List<string>>(CacheKeys.CitiesStartWith(prefix), ct);

        if (cities is null)
        {
            cities = await _context.Airports
                .AsNoTracking()
                .Where(a => EF.Functions.ILike(a.City, $"{prefix}%"))                
                .Select(a => a.City)
                .Distinct()
                .OrderBy(c => c)
                .Take(take)
                .ToListAsync(ct);

            await _cacheService.SetAsync(CacheKeys.CitiesStartWith(prefix), cities, TimeSpan.FromHours(24), ct);
        }
        return cities;
    }
}
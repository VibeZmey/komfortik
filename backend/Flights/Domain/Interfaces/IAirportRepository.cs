using Flights.Application.Features.Airports.GetCitiesByName;

namespace Flights.Domain.Interfaces;

public interface IAirportRepository
{
    Task<List<string>> GetCitiesByPrefix(string prefix, int take, CancellationToken ct = default);
}
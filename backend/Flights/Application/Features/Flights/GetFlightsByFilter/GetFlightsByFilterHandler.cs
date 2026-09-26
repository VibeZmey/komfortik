using Flights.Application.Common.Interfaces;
using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Infrastructure.Common;
using MediatR;

namespace Flights.Application.Features.Flights.GetFlightsByFilter;

public class GetFlightsByFilterHandler : 
    IRequestHandler<GetFlightsByFilterQuery, IReadOnlyCollection<GetFlightsByFilterDto>>
{
    private readonly IFlightRepository _flightRepo;
    private readonly ICacheService _cacheService;
    
    public GetFlightsByFilterHandler(
        IFlightRepository flightRepository,
        ICacheService cacheService)
    {
        _cacheService = cacheService;
        _flightRepo = flightRepository;    
    }
    
    public async Task<IReadOnlyCollection<GetFlightsByFilterDto>> Handle(GetFlightsByFilterQuery request, CancellationToken cancellationToken)
    {
        var query = GetFlightsByFilterQuery.ToSearchFlightsQuery(request); 
        var flights = await _cacheService.GetAsync<IReadOnlyCollection<GetFlightsByFilterDto>>(
            CacheKeys.FlightsByFilterKey(query), 
            cancellationToken);
        
        if (flights is null)
        {
            
            flights = await _flightRepo.GetFlightsByFilterAsync(query, cancellationToken);
            await _cacheService.SetAsync(
                CacheKeys.FlightsByFilterKey(query), flights, 
                TimeSpan.FromMinutes(3), cancellationToken);
        }
        return flights;
    }
}
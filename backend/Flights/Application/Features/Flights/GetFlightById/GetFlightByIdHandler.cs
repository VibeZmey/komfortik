using Flights.Domain.Dto;
using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Flights.GetFlightById;

public class GetFlightByIdHandler : IRequestHandler<GetFlightByIdQuery, FlightDto>
{
    private readonly IFlightRepository _flightRepo;

    public GetFlightByIdHandler(IFlightRepository flightRepository)
    {
        _flightRepo = flightRepository;
    }
    
    public async Task<FlightDto> Handle(GetFlightByIdQuery request, CancellationToken cancellationToken)
    {
        var flight = await _flightRepo
            .GetByIdWithDetailsAsync(request.FlightId, cancellationToken);

        if (flight is null)
            throw new ApplicationException("Flight not found");
        
        return Flight.ToDto(flight);
    }
}
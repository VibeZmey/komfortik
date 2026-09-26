using Flights.Domain.Dto;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Flights.GetFlightById;

public class GetFlightByIdQuery : IRequest<FlightDto>
{
    public Guid FlightId { get; set; }
}
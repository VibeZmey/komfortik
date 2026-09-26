using Flights.Domain.Dto;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Passengers.GetPassengersWithDocumentsByUserId;

public class GetPassengersWithDocumentsByUserIdQuery : IRequest<IReadOnlyCollection<PassengerWithDocumentsDto>>
{
    public Guid UserId { get; set; }
}
using System.Text.Json.Serialization;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Passengers.UpdatePassengerInfo;

public class UpdatePassengerInfoCommand : IRequest<UpdatePassengerDto>
{
    [JsonIgnore]
    public Guid Id { get; private set; }
    public string? Email { get; private set; }
    public string? PhoneNumber { get; private set; }
}
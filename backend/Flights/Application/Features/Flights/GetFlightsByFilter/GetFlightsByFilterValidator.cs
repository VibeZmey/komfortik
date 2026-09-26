using Flights.Application.Features.Flights.GetFlightsByFilter;
using FluentValidation;

namespace Flights.Application.Features.Flights;

public class GetFlightsByFilterValidator : AbstractValidator<GetFlightsByFilterQuery>
{
    public GetFlightsByFilterValidator()
    {
    }
}
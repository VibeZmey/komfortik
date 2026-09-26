using FluentValidation;

namespace Flights.Application.Features.Passengers.CreatePassenger;

public class CreatePassengerValidator : AbstractValidator<CreatePassengerCommand>
{
    public CreatePassengerValidator()
    {
        RuleFor(p => p.UserId)
            .NotEmpty()
            .NotEqual(Guid.Empty)
            .WithMessage("UserId is required");
    }
}
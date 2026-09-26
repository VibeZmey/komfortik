using Flights.Domain.Models;
using FluentValidation;

namespace Flights.Application.Features.Documents.CreateDocument;

public class CreateDocumentValidator : AbstractValidator<CreateDocumentCommand>
{
    public CreateDocumentValidator()
    {
        RuleFor(d => d.FirstName)
            .Must(d => 
                !String.IsNullOrWhiteSpace(d))
            .WithMessage("First name is required");

        RuleFor(d => d.MiddleName)
            .Must(d =>
                !String.IsNullOrWhiteSpace(d))
            .When(d => d.MiddleName is not null)
            .WithMessage("Middle name cannot be empty");
        
        RuleFor(d => d.LastName)
            .Must(d => 
                !String.IsNullOrWhiteSpace(d))
            .WithMessage("Last name is required");
        
        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Document type is required");
        
        RuleFor(x => x.Gender)
            .IsInEnum()
            .WithMessage("Gender type is required");
        
        RuleFor(d => d.Number).NotEmpty().WithMessage("Number is required");
        RuleFor(d => d.UserId).NotEmpty().WithMessage("UserId is required");
        RuleFor(d => d.DateOfBirth).NotEmpty().WithMessage("Date of birth is required");
        RuleFor(d => d.PassengerId).NotEmpty().WithMessage("PassengerId is required");
    }
}
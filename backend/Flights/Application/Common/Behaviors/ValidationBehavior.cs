using MediatR;
using FluentValidation;
using FluentValidation.Results;

namespace Flights.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators) 
    : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    public Task<TResponse> Handle(TRequest request,CancellationToken cancellationToken, RequestHandlerDelegate<TResponse> next)
    {
        ValidationContext<TRequest> context = new ValidationContext<TRequest>(request);
        
        List<ValidationFailure> failures = validators
            .Select(v => v.Validate(context))
            .SelectMany(result => result.Errors)
            .Where(failure => failure is not null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);
        
        return next();
    }
}
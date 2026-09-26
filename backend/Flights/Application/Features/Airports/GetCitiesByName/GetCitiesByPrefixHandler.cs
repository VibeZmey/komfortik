using Flights.Domain.Interfaces;
using MediatR;

namespace Flights.Application.Features.Airports.GetCitiesByName;

public class GetCitiesByPrefixHandler : IRequestHandler<GetCitiesByPrefixQuery, List<string>>
{
    private readonly IAirportRepository _airportRepo;
    private readonly IUnitOfWork  _unitOfWork;

    public GetCitiesByPrefixHandler(
        IAirportRepository airportRepository,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _airportRepo = airportRepository;
    }
    
    public async Task<List<string>> Handle(GetCitiesByPrefixQuery request, CancellationToken cancellationToken)
    {
        return await _airportRepo
            .GetCitiesByPrefix(request.Prefix, request.Take, cancellationToken);
    }
}
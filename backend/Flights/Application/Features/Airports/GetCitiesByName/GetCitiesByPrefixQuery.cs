using MediatR;

namespace Flights.Application.Features.Airports.GetCitiesByName;

public class GetCitiesByPrefixQuery : IRequest<List<string>>
{
    public string Prefix { get; set; }
    public int Take { get; set; }
}
using Flights.Domain.Dto;
using MediatR;

namespace Flights.Application.Features.Flights.GetFlightsByFilter;

public class GetFlightsByFilterQuery : IRequest<IReadOnlyCollection<GetFlightsByFilterDto>>
{
    public DateTime DepartureDate { get; init; }
    public DateTime? ReturnDate { get; init; }   
    public string OriginCity { get; init; } 
    public string DestinationCity { get; init; } 
    public int Adults { get; init; } = 1;
    public int Kids { get; init; } 
    public int Babies { get; init; }  
    public decimal? MaxTotalPrice { get; init; }
    public int? DepartureHourFrom { get; init; } 
    public int? DepartureHourTo { get; init; } 
    public Guid? AirlineId { get; init; }
    public bool IsBusinessOnly { get; init; }
    public FlightSortField SortBy { get; init; } = FlightSortField.Price;
    public SortDirection SortDirection { get; init; } = SortDirection.Ascending;
    public int PageSize { get; init; }
    public int PageNumber { get; init; }
    
    public static SearchFlightsQuery ToSearchFlightsQuery(GetFlightsByFilterQuery query)
    {
        return new SearchFlightsQuery()
        {
            DepartureDate = query.DepartureDate,
            ReturnDate = query.ReturnDate,
            OriginCity = query.OriginCity,
            DestinationCity = query.DestinationCity,
            Adults = query.Adults,
            Kids = query.Kids,
            Babies = query.Babies,
            MaxTotalPrice = query.MaxTotalPrice,
            DepartureHourFrom = query.DepartureHourFrom,
            DepartureHourTo = query.DepartureHourTo,
            AirlineId = query.AirlineId,
            IsBusinessOnly = query.IsBusinessOnly,
            SortBy = query.SortBy,
            SortDirection = query.SortDirection,
            PageSize = query.PageSize,
            PageNumber = query.PageNumber,
        };
    }
}
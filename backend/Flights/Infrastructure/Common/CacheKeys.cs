using Flights.Domain.Dto;

namespace Flights.Infrastructure.Common;




public static class CacheKeys
{
    public static string CitiesStartWith(string startWith)
        => $"cities:startwith:{startWith}:";
    
    public static string AirportsByCityKey(string city)
        => $"airports:city:{city}";
    
    public static string FlightsByFilterKey(SearchFlightsQuery query)
    {
        return $"flights:search:" +
               $"{query.DepartureDate:yyyy-MM-dd}:" +
               $"{query.ReturnDate:yyyy-MM-dd}:" +
               $"{query.OriginCity}:" +
               $"{query.DestinationCity}:" +
               $"{query.Adults}:" +
               $"{query.Kids}:" +
               $"{query.Babies}:" +
               $"{query.MaxTotalPrice}:" +
               $"{query.DepartureHourFrom}:" +
               $"{query.DepartureHourTo}:" +
               $"{query.AirlineId}:" +
               $"{query.IsBusinessOnly}:" +
               $"{query.SortBy}:" +
               $"{query.SortDirection}:" +
               $"{query.PageSize}:" +
               $"{query.PageNumber}";
    }
}
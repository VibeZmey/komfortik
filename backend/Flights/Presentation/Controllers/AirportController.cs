using Flights.Application.Features.Airports.GetCitiesByName;
using Flights.Domain.Dto;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flights.Presentation.Controllers;

[ApiController]
[Authorize]
[Route("airports")]
public class AirportController : ControllerBase
{
    private readonly IMediator _mediator;
    public AirportController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [AllowAnonymous]
    [HttpGet("cities")]
    public async Task<ActionResult<List<string>>> GetCities([FromQuery] string q, [FromQuery] int take)
    {
        var res = await _mediator.Send(new GetCitiesByPrefixQuery()
        {
            Prefix = q,
            Take = take
        });
        return Ok(res);
    }
    
}
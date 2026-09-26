using Flights.Application.Features.Flights.GetFlightsByFilter;
using Flights.Application.Features.Notifications.GetNotificationsByUserId;
using Flights.Application.Features.Notifications.MarkAsReadByNotificationId;
using Flights.Domain.Dto;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flights.Presentation.Controllers;

[ApiController]
[Authorize]
[Route("notifications")]
public class NotificationController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public NotificationController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpGet("me")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<List<NotificationDto>>> GetFlightsByFilter(CancellationToken ct = default)
    {
        var query = new GetNotificationsByUserIdQuery()
        {
            UserId = Guid.Parse(User.FindFirst("userId").Value)
        };
        return Ok(await _mediator.Send(query, ct));
    }

    [HttpPost("{id}/markasread")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<IActionResult> MarkFlightsAsRead([FromRoute] Guid id, CancellationToken ct = default)
    {
        var query = new MarkAsReadByNotificationIdQuery()
        {
            NotificationId = id
        };
        await _mediator.Send(query, ct);
        return Ok();
    }
}
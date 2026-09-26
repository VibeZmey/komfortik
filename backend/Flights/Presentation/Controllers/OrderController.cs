using System.Security.Claims;
using Flights.Application.Features.Orders.CancelOrder;
using Flights.Application.Features.Orders.ConfirmOrder;
using Flights.Application.Features.Orders.CreateOrder;
using Flights.Application.Features.Orders.GetAllOrders;
using Flights.Application.Features.Orders.GetOrderById;
using Flights.Application.Features.Orders.GetOrdersByUserId;
using Flights.Domain.Dto;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Flights.Presentation.Controllers;


[ApiController]
[Authorize]
[Route("orders")]
public class OrderController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrderController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpPost]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<Guid>> CreateOrder([FromBody] CreateOrderCommand request,
        CancellationToken ct)
    {
        var res = await _mediator.Send(request, ct);
        return Ok(res);
    }
    
    [HttpPost("{id:guid}/confirm")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<IActionResult> ConfirmOrder([FromRoute] Guid id,
        CancellationToken ct)
    {
        var command = new ConfirmOrderCommand()
        {
            OrderId = id,
            Email = User.FindFirst(ClaimTypes.Email).Value
        };
        await _mediator.Send(command, ct);
        return Ok();
    }
    
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<OrderDto>> GetOrderById([FromRoute] Guid id,
        CancellationToken ct)
    {
        var query = new GetOrderByIdQuery() { OrderId = id, };
        return Ok(await _mediator.Send(query, ct));
    }
    
    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<IActionResult> CancelOrder([FromRoute] Guid id,
        CancellationToken ct)
    {
        var command = new CancelOrderCommand()
        {
            OrderId = id,
        };
        await _mediator.Send(command, ct);
        return Ok();
    }
    
    [HttpGet("me")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<List<OrderDto>>> GetMyOrdersAsync(CancellationToken ct)
    {
        var query = new GetOrdersByUserIdQuery()
        {
            UserId = Guid.Parse(User.FindFirst("userId").Value)
        };
        var res = await _mediator.Send(query, ct);
        return  Ok(res);
    }
    
    [HttpGet("{userId:guid}/all")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<List<OrderDto>>> GetOrderByUserIdAsync(CancellationToken ct)
    {
        var query = new GetOrdersByUserIdQuery()
        {
            UserId = Guid.Parse(User.FindFirst("userId").Value)
        };
        var res = await _mediator.Send(query, ct);
        return  Ok(res);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<OrderDto>>> GetOrdersByUserId()
    {
        return Ok(await _mediator.Send(new GetAllOrdersQuery()));
    }
    
}
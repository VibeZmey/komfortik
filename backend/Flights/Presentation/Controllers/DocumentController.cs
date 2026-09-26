using Flights.Application.Features.Documents.CreateDocument;
using Flights.Application.Features.Documents.DeleteDocumet;
using Flights.Application.Features.Documents.UpdateDocument;
using Flights.Application.Features.Documents.ValidateDocument;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace Flights.Presentation.Controllers;

[ApiController]
[Authorize]
[Route("documents")]
public class DocumentController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public DocumentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("validate")]
    [Authorize(Roles = "Admin, User")]
    public async Task<ActionResult<bool>> ValidateDocument([FromBody] ValidateDocumentCommand command,
        CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return Ok();
    }
        
    
    
    [HttpPost]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<CreateDocumentDto>> CreateDocument(
        [FromBody] CreateDocumentCommand command, 
        CancellationToken ct)
    {
        command.UserId = Guid.Parse(User.FindFirst("userId").Value);
        var res = await _mediator.Send(command, ct);
        return Ok(res);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin, User, Supporter")]
    public async Task<ActionResult<UpdateDocumentDto>> UpdateDocument([FromRoute] Guid id, [FromBody] UpdateDocumentCommand command, CancellationToken ct)
    {
        command.Id = id;
        return await _mediator.Send(command, ct);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin, User")]
    public async Task<IActionResult> DeleteDocument([FromRoute] Guid id, CancellationToken ct)
    {
        var command = new DeleteDocumentCommand() { DocumentId = id };
        await _mediator.Send(command, ct);
        return Ok();
    }
    
}
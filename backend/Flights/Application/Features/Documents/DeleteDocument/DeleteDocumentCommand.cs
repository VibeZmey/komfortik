using MediatR;

namespace Flights.Application.Features.Documents.DeleteDocumet;

public class DeleteDocumentCommand : IRequest<Unit>
{
    public Guid DocumentId { get; set; }
}
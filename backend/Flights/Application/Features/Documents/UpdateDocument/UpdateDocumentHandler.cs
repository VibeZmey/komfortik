using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MediatR;

namespace Flights.Application.Features.Documents.UpdateDocument;

public class UpdateDocumentHandler 
    : IRequestHandler<UpdateDocumentCommand, UpdateDocumentDto>
{
    private readonly IDocumentRepository _documentRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateDocumentHandler> _logger;
    private readonly IEncryptionService _encryptionService;

    public UpdateDocumentHandler(
        IDocumentRepository documentRepository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateDocumentHandler> logger,
        IEncryptionService encryptionService)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
        _documentRepo = documentRepository;
        _encryptionService = encryptionService;
    }
    
    public async Task<UpdateDocumentDto> Handle(UpdateDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _documentRepo
            .GetByIdAsync(request.Id, cancellationToken);
        
        if(document is null)
            throw new ArgumentException($"Document not found");
        
        Document.Update(
            document,
            request.FirstName,
            request.MiddleName,
            request.LastName,
            //TODO: Возможно переделать чтобы не было .Decrypt
            request.Number ?? _encryptionService.Decrypt(document.Number), 
            //Если у документа который сечас в базе нет серии, то она там не может появиться
            //Если пользователь не изменял серию, то нам нужно ее расшифровать для валидации
            //Иначе просто передаем измененную серию
            document.Series is null ?  null : request.Series ?? _encryptionService.Decrypt(document.Series),
            request.Gender,
            request.DateOfBirth,
            request.ValidityPeriod);
        
        var encryptedSeries = document.Series is not null ?
            _encryptionService.Encrypt(document.Series) : null;
        
        var encryptedNumber = _encryptionService.Encrypt(document.Number);
        document.SetEncryptedData(encryptedNumber, encryptedSeries);
        
        await _unitOfWork.SaveAsync(cancellationToken);
        return UpdateDocumentDto.Map(document);
    }
}
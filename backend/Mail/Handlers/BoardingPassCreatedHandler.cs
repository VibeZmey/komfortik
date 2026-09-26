using Mail.Interfaces;
using Mail.Models;
using Org.BouncyCastle.Crypto;
using SharedContracts.Messages;

namespace Mail.Handlers;

public class BoardingPassCreatedHandler : IConsumerHandler<BoardingPassCreated>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<BoardingPassCreatedHandler> _logger;
    private readonly IEmailTemplateService _templateService;
    private readonly IMinioFileService _minioFiles;
    
    public BoardingPassCreatedHandler(
        IEmailService emailService,
        ILogger<BoardingPassCreatedHandler> logger,
        IEmailTemplateService templateService,
        IMinioFileService minioFiles)
    {
        _logger = logger;
        _emailService = emailService;
        _templateService = templateService;
        _minioFiles = minioFiles;
    }
    public async Task HandleAsync(BoardingPassCreated message, CancellationToken ct = default)
    {
        var msg = message;

        try
        {
            var fileName = $"boarding-passes-{msg.OrderId}.pdf";
            var pdfBytes = await _minioFiles.DownloadFileAsync(fileName, ct);
            
            var (subject, body) = await _templateService
                .GetOrderConfirmedTemplateAsync(msg.OrderId, msg.TotalPrice, msg.Email);

            if (pdfBytes == null)
            {
                _logger.LogWarning("Boarding pass not found in MinIO: {FileName}", fileName);
                await _emailService.SendEmailAsync(msg.Email, subject, body);
            }
            else
            {
                var attachment = new EmailAttachment()
                {
                    FileName = fileName,
                    Content = pdfBytes,
                };
                await _emailService.SendEmailAsync(msg.Email, subject, body, attachment);
            }
            
            _logger.LogInformation("Order confirm email sent to {Email}", msg.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send order confirm email to {Email}", msg.Email);
            throw;
        }
    }
}
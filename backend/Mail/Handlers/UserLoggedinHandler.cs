using Mail.Interfaces;
using SharedContracts.Messages;

namespace Mail.Handlers;

public class UserLoggedinHandler : IConsumerHandler<UserLoggedin>
{
    private readonly ILogger<UserLoggedinHandler> _logger;
    private readonly IEmailService _emailService;
    private readonly IEmailTemplateService _templateService;

    public UserLoggedinHandler(
        ILogger<UserLoggedinHandler> logger, 
        IEmailService emailService, 
        IEmailTemplateService templateService)
    {
        _logger = logger;
        _emailService = emailService;
        _templateService = templateService;
    }

    public async Task HandleAsync(UserLoggedin message, CancellationToken ct = default)
    {
        var msg = message;

        try
        {
            var (subject, body) = await _templateService
                .GetLoginConfirmationTemplateAsync(msg.Email.Split('@')[0], msg.ConfirmationLink, msg.CreatedAt);

            await _emailService.SendEmailAsync(msg.Email, subject, body);

            _logger.LogInformation("Login email sent to {Email}", msg.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send login email to {Email}", msg.Email);
            throw;
        }
    }
}
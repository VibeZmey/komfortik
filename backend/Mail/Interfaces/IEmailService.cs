using Mail.Models;

namespace Mail.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string email, string subject, string message, EmailAttachment? attachment = null);
    
}
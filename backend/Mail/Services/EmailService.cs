using Mail.Interfaces;
using Mail.Models;
using Mail.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;

namespace Mail.Services;



public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<EmailSettings> settings,
        ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, EmailAttachment? attachment = null)
    {
        var message = new MimeMessage();
        
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        message.To.Add(new MailboxAddress("Пользователь", to));
        
        if (!string.IsNullOrEmpty(_settings.ReplyTo))
            message.ReplyTo.Add(new MailboxAddress(_settings.ReplyTo, _settings.ReplyTo));
        
        message.Subject = subject;
        
        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = StripHtml(htmlBody)
        };
        if (attachment != null)
        {
            bodyBuilder.Attachments.Add(
                attachment.FileName, 
                attachment.Content, 
                ContentType.Parse(attachment.ContentType));
        }

        
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            
            await client.ConnectAsync("smtp.yandex.ru", 465, SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync("ermolnikovivan@yandex.ru", "hvbxazuvlzdltees");
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            
            _logger.LogInformation("Email sent to {To} via {Host}", to, _settings.SmtpHost);
        }
        catch (SmtpCommandException ex)
        {
            _logger.LogError(ex, "SMTP error to {To}: {StatusCode} - {Message}", 
                to, ex.StatusCode, ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }
    
    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return string.Empty;
        return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty)
            .Replace("&nbsp;", " ")
            .Trim();
    }
}
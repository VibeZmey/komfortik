using System.Text.Encodings.Web;
using Mail.Interfaces;

namespace Mail.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<EmailTemplateService> _logger;

    public EmailTemplateService(
        IWebHostEnvironment env,
        ILogger<EmailTemplateService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<(string Subject, string Body)> GetRegistrationTemplateAsync(
        string login, string confirmationLink, DateTime createdAt)
    {
        var layout = await LoadTemplateAsync("_layout.html");
        var content = await LoadTemplateAsync("registration.html");
        
        var filledContent = content
            .Replace("{{Login}}", HtmlEncoder.Default.Encode(login))
            .Replace("{{ConfirmationLink}}", confirmationLink)
            .Replace("{{CreatedAt}}", createdAt.ToString("dd.MM.yyyy HH:mm"));
        
        var body = MergeLayout(layout, filledContent, "Confirm the registration");
        
        return ("Confirm your registration with AirVibe", body);
    }

    public async Task<(string Subject, string Body)> GetLoginConfirmationTemplateAsync(
        string login, string confirmationLink, DateTime createdAt)
    {
        var layout = await LoadTemplateAsync("_layout.html");
        var content = await LoadTemplateAsync("login-confirmation.html");
        
        var filledContent = content
            .Replace("{{Login}}", HtmlEncoder.Default.Encode(login))
            .Replace("{{ConfirmationLink}}", confirmationLink)
            .Replace("{{CreatedAt}}", createdAt.ToString("dd.MM.yyyy HH:mm"));
        
        var body = MergeLayout(layout, filledContent, "Confirm your login");
        
        return ("Confirm your account login", body);
    }

    public async Task<(string Subject, string Body)> GetOrderConfirmedTemplateAsync(
        Guid orderId, decimal totalPrice, string email)
    {
        var layout = await LoadTemplateAsync("_layout.html");
        var content = await LoadTemplateAsync("order-confirmed.html");
        
        var shortId = orderId.ToString("N")[..8].ToUpper();
        
        var filledContent = content
            .Replace("{{OrderId}}", orderId.ToString())
            .Replace("{{OrderIdShort}}", shortId)
            .Replace("{{TotalPrice}}", totalPrice.ToString("N0"))
            .Replace("{{Email}}", HtmlEncoder.Default.Encode(email));
        
        var body = MergeLayout(layout, filledContent, $"Order #{shortId}");
        
        return ($"Order #{shortId} confirmed", body);
    }

    private async Task<string> LoadTemplateAsync(string fileName)
    {
        var path = Path.Combine(_env.ContentRootPath, "Templates", fileName);
        return await File.ReadAllTextAsync(path);
    }

    private string MergeLayout(string layout, string content, string previewText)
    {
        return layout
            .Replace("{{PreviewText}}", previewText)
            .Replace("{{Subject}}", previewText)
            .Replace("{{Content}}", content);
    }
}
namespace Mail.Interfaces;

public interface IEmailTemplateService
{
    Task<(string Subject, string Body)> GetRegistrationTemplateAsync(
        string login, string confirmationLink, DateTime createdAt);
    
    Task<(string Subject, string Body)> GetLoginConfirmationTemplateAsync(
        string login, string confirmationLink, DateTime createdAt);
    
    Task<(string Subject, string Body)> GetOrderConfirmedTemplateAsync(
        Guid orderId, decimal totalPrice, string email);
}
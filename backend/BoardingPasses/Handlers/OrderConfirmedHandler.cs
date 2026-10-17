using BoardingPasses.Services;
using SharedContracts.Messages;

namespace BoardingPasses.Handlers;

public class OrderConfirmedHandler
{
    private readonly IBoardingPassService _boardingPassService;
    private readonly ILogger<OrderConfirmedHandler> _logger;

    public OrderConfirmedHandler(
        IBoardingPassService boardingPassService,
        ILogger<OrderConfirmedHandler> logger)
    {
        _boardingPassService = boardingPassService;
        _logger = logger;
    }
    
    
    public async Task HandleAsync(OrderConfirmed message, CancellationToken ct = default)
    {
        var msg = message;
        
        _logger.LogInformation($"Order {msg.OrderId} {msg.Email} {msg.TotalPrice} {msg.BoardingPasses} {msg.BoardingPasses.Count}");
        
        if (msg == null || msg.OrderId == Guid.Empty || msg.BoardingPasses == null || msg.BoardingPasses.Count == 0)
            throw new Exception("Board passes list cannot be empty");

        try
        {
            await _boardingPassService.GenerateBoardingPassesAsync(msg, ct);
            await _boardingPassService.SendToEmailAsync(msg.OrderId, msg.Email, msg.TotalPrice, ct);
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }
}
using Flights.Infrastructure.Common;
using Flights.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Flights.Infrastructure.Workers;

public class OutboxWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxWorker> _logger;
    private const int BatchSize = 50;
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(5);
    

    public OutboxWorker(IServiceProvider serviceProvider, ILogger<OutboxWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timer = new PeriodicTimer(PollingInterval);

        while (!stoppingToken.IsCancellationRequested &&
               await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Outbox processor failed. Retrying after delay.");
            }
        }
    }

    private async Task ProcessBatchAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<FlightsDbContext>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        var messages = await context.OutboxMessages
            .Where(m => !m.Processed && m.Retries < 5)
            .OrderBy(m => m.OccurredOn)
            .Take(BatchSize)
            .ToListAsync(ct);

        foreach (var msg in messages)
        {
            try
            {
                //var evt = EventSerializer.Deserialize(msg.Type, msg.Data);
                //await mediator.Publish(evt, ct);
                msg.Processed = true;
            }
            catch (Exception ex)
            {
                msg.Retries++;
                msg.LastError = ex.Message[..Math.Min(ex.Message.Length, 500)];
                _logger.LogError(ex, "Failed to process outbox message {Id}. Retry #{Retries}", msg.Id, msg.Retries);
            }
        }

        if (messages.Any())
            await context.SaveChangesAsync(ct);
    }
}
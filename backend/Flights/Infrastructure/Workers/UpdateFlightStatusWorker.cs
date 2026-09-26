using Flights.Application.Features.Flights.UpdateFlightStatus;
using MediatR;

namespace Flights.Infrastructure.Workers;

public class UpdateFlightStatusWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    //TODO: не забыть поставить прод время
    private static readonly TimeSpan PollingInterval = TimeSpan.FromMinutes(1);
    public UpdateFlightStatusWorker(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
        var timer = new PeriodicTimer(PollingInterval);

        while (!stoppingToken.IsCancellationRequested &&
               await timer.WaitForNextTickAsync(stoppingToken))
        {
            await mediator.Send(new UpdateFlightStatusCommand(), stoppingToken);
        }
    }
}
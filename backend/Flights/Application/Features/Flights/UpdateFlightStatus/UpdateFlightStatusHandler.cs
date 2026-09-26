using Flights.Domain.Interfaces;
using Flights.Domain.Models;
using MassTransit;
using MediatR;

namespace Flights.Application.Features.Flights.UpdateFlightStatus;



public class UpdateFlightStatusHandler : IRequestHandler<UpdateFlightStatusCommand, Unit>
{
    private readonly IFlightRepository _flightRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationRepository _notifyRepo;
    private readonly ILogger<UpdateFlightStatusHandler> _logger;

    public UpdateFlightStatusHandler(
        IFlightRepository flightRepository,
        IUnitOfWork unitOfWork,
        INotificationRepository notifyRepo,
        ILogger<UpdateFlightStatusHandler> logger)
    {
        _flightRepo = flightRepository;
        _unitOfWork = unitOfWork;
        _notifyRepo = notifyRepo;
        _logger = logger;
    }
    
    public async Task<Unit> Handle(UpdateFlightStatusCommand request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var flights = await _flightRepo
            .GetFlightsReadyForTimeTransitionsAsync(now, cancellationToken);

        foreach (var flight in flights)
        {
            flight.ApplyScheduledTransitions(now);
            if (flight.Status == FlightStatus.CheckIn)
            {
                var userIds = await _flightRepo.GetUserIdsByFlightIdAsync(flight.Id, cancellationToken);
                
                if (!userIds.Any()) continue;

                var notifications = userIds
                    .Select(userId =>
                        Notification.CreateCheckInOpened(flight, userId))
                    .ToList();
            
                await _notifyRepo.AddRangeAsync(notifications, cancellationToken);
            }
        }

        await _unitOfWork.SaveAsync(cancellationToken);
        return Unit.Value;
    }
}
using Flights.Domain.Dto;
using Flights.Domain.Models;
using SharedContracts.Messages;

namespace Flights.Domain.Interfaces;

public interface IOrderRepository
{
    Task AddAsync(Order order, CancellationToken ct);
    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct);
    Task UpdateAsync(Order order, CancellationToken ct);
    Task<List<BoardingPass>> GetOrderForBoardingPassesAsync(Guid id, CancellationToken ct);
    Task<List<OrderDto>> GetOrdersByUserIdAsync(Guid id, CancellationToken ct);
    Task<List<OrderDto>> GetAllOrdersAsync(CancellationToken ct = default);
}
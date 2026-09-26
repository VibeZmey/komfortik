namespace Mail.Interfaces;

public interface IConsumerHandler<in TMessage>
{
    Task HandleAsync(TMessage message, CancellationToken ct = default);
}
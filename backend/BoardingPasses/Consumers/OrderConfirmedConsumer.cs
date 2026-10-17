using System.Text.Json;
using BoardingPasses.Handlers;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using SharedContracts.Messages;

namespace BoardingPasses.Consumers;

public class OrderConfirmedConsumer : BackgroundService
{
    private readonly OrderConfirmedHandler _handler;
    private readonly ILogger<OrderConfirmedConsumer> _logger;
    private readonly JsonSerializerOptions _json;

    public OrderConfirmedConsumer(
        OrderConfirmedHandler handler,
        ILogger<OrderConfirmedConsumer> logger,
        JsonSerializerOptions json)
    {
        _handler = handler;
        _logger = logger;
        _json = json;
    }

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        var adminConfig = new AdminClientConfig { BootstrapServers = "kafka:9092" };
        using var admin = new AdminClientBuilder(adminConfig).Build();

        var topicSpec = new TopicSpecification
        {
            Name = "order-confirmed",
            NumPartitions = 3,
            ReplicationFactor = 1
        };
        try
        {
            await admin.CreateTopicsAsync(
                [topicSpec], 
                new CreateTopicsOptions { RequestTimeout = TimeSpan.FromSeconds(10) });
            
            _logger.LogInformation("Topic created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create topic");
        }
        
        await base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var consumerConfig = new ConsumerConfig
        {
            BootstrapServers = "kafka:9092",
            GroupId = "boarding-passes-service",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
        consumer.Subscribe("order-confirmed");

        while (!stoppingToken.IsCancellationRequested)
        {
            var cr = consumer.Consume(stoppingToken);

            var message = JsonSerializer.Deserialize<OrderConfirmed>(cr.Message.Value, _json);
            if (message is null)
            {
                consumer.Commit(cr);
                continue;
            }

            await _handler.HandleAsync(message, stoppingToken);
            consumer.Commit(cr);
        }
    }
}
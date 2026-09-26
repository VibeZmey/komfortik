using System.Text.Json;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Mail.Interfaces;
using SharedContracts.Messages;

namespace Mail.Consumers;

public class UserRegisteredConsumer : BackgroundService
{
    private readonly IConfiguration _config;
    private readonly IConsumerHandler<UserRegistered> _handler;
    private readonly JsonSerializerOptions _json;
    private readonly ILogger<UserRegisteredConsumer> _logger;

    public UserRegisteredConsumer(
        IConfiguration config,
        IConsumerHandler<UserRegistered> handler,
        JsonSerializerOptions json,
        ILogger<UserRegisteredConsumer> logger)
    {
        _config = config;
        _handler = handler;
        _json = json;
        _logger = logger;
    }
    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        var adminConfig = new AdminClientConfig { BootstrapServers = "kafka:9092" };
        using var admin = new AdminClientBuilder(adminConfig).Build();

        var topicSpec = new TopicSpecification
        {
            Name = "user-registered",
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
            GroupId = "mail-service",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
        consumer.Subscribe("user-registered");

        while (!stoppingToken.IsCancellationRequested)
        {
            var cr = consumer.Consume(stoppingToken);

            var message = JsonSerializer.Deserialize<UserRegistered>(cr.Message.Value, _json);
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
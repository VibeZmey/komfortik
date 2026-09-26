using System.Text.Json;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Mail.Handlers;
using Mail.Interfaces;
using SharedContracts.Messages;

namespace Mail.Consumers;

public class UserLoggedinConsumer : BackgroundService
{
    private readonly IConfiguration _config;
    private readonly ILogger<UserLoggedinConsumer> _logger;
    private readonly IConsumerHandler<UserLoggedin> _handler;
    private readonly JsonSerializerOptions _json;

    public UserLoggedinConsumer(
        IConfiguration config,
        IConsumerHandler<UserLoggedin> handler,
        JsonSerializerOptions json,
        ILogger<UserLoggedinConsumer> logger)
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
            Name = "user-loggedin",
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
        consumer.Subscribe("user-loggedin");

        while (!stoppingToken.IsCancellationRequested)
        {
            var cr = consumer.Consume(stoppingToken);

            var message = JsonSerializer.Deserialize<UserLoggedin>(cr.Message.Value, _json);
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
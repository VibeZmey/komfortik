using System.Text.Json;
using System.Text.Json.Serialization;
using BoardingPasses.Consumers;
using BoardingPasses.Handlers;
using BoardingPasses.Options;
using BoardingPasses.Publishers;
using BoardingPasses.Services;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Minio;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Flights API", 
        Version = "v1" 
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            [..Array.Empty<string>()]
        }
    });
});
QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllers();
builder.Services.Configure<MinioOptions>(builder.Configuration.GetSection("Minio"));
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MinioOptions>>().Value;
    
    return new MinioClient()
        .WithEndpoint(settings.Endpoint)
        .WithCredentials(settings.AccessKey, settings.SecretKey)
        .WithSSL(settings.Secure)
        .Build();
});
builder.Services.AddScoped<IBoardingPassStorageService, BoardingPassStorageService>();
builder.Services.AddScoped<IBoardingPassService, BoardingPassService>();

builder.Logging.SetMinimumLevel(LogLevel.Debug);

builder.Services.AddSingleton(new ProducerConfig
{
    BootstrapServers = builder.Configuration["Kafka:BootstrapServers"],
    Acks = Acks.All,
    EnableIdempotence = true
});

builder.Services.AddSingleton<IProducer<string, string>>(sp =>
{
    var cfg = sp.GetRequiredService<ProducerConfig>();
    return new ProducerBuilder<string, string>(cfg).Build();
});
builder.Services.AddSingleton<Publisher>();
builder.Services.AddSingleton(new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
});
builder.Services.AddHostedService<OrderConfirmedConsumer>();
builder.Services.AddSingleton<OrderConfirmedHandler>();



var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();

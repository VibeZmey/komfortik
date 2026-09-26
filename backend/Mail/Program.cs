using System.Text.Json;
using System.Text.Json.Serialization;
using Mail.Consumers;
using Mail.Handlers;
using Mail.Interfaces;
using Mail.Options;
using Mail.Services;
using Microsoft.Extensions.Options;
using Minio;
using SharedContracts.Messages;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddOpenApi();

builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<IEmailTemplateService, EmailTemplateService>();
builder.Services.AddSingleton<IMinioFileService, MinioFileService>();

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

builder.Services.AddSingleton(new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
});

builder.Services.AddSingleton<IConsumerHandler<UserLoggedin>, UserLoggedinHandler>();
builder.Services.AddSingleton<IConsumerHandler<UserRegistered>, UserRegisteredHandler>();
builder.Services.AddSingleton<IConsumerHandler<BoardingPassCreated>, BoardingPassCreatedHandler>();

builder.Services.AddHostedService<UserLoggedinConsumer>();
builder.Services.AddHostedService<UserRegisteredConsumer>();
builder.Services.AddHostedService<BoardingPassCreatedConsumer>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();

using BoardingPasses.Publishers;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using SharedContracts.Messages;

namespace BoardingPasses.Services;

public interface IBoardingPassService
{
    Task GenerateBoardingPassesAsync(OrderConfirmed request, CancellationToken ct = default);
    Task SendToEmailAsync(Guid orderId, string email, decimal totalPrice, CancellationToken ct = default);
}   

public class BoardingPassService : IBoardingPassService
{
    private readonly byte[]? _qrImage;
    private readonly IBoardingPassStorageService _storageService;
    private readonly Publisher _publisher;

    public BoardingPassService(
        IBoardingPassStorageService storageService, 
        Publisher publisher)
    {
        _publisher = publisher;
        _storageService = storageService;

        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "code", "qrcode.png"),
            Path.Combine(AppContext.BaseDirectory, "code", "qrcode.png"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "code", "qrcode.png")
        };

        foreach (var path in candidates)
        {
            try
            {
                if (File.Exists(path))
                {
                    _qrImage = File.ReadAllBytes(path);
                    break;
                }
            }
            catch
            {
            }
        }
    }

    public async Task GenerateBoardingPassesAsync(OrderConfirmed request, CancellationToken ct = default)
    {
        var pdfBytes = Document.Create(container =>
        {
            foreach (var pass in request.BoardingPasses)
            {
                container.Page(page => BuildBoardingPassPage(page, pass));
            }
        }).GeneratePdf();

        var objectName = $"boarding-passes-{request.OrderId:D}.pdf";
        await _storageService.UploadAsync(pdfBytes, objectName, ct);
    }

    public async Task SendToEmailAsync(Guid orderId, string email, decimal totalPrice, CancellationToken ct = default)
    {
        await _publisher.PublishAsync("boarding-pass-created", orderId.ToString(),
            new BoardingPassCreated()
                {
                    OrderId = orderId,
                    Email = email,
                    TotalPrice = totalPrice,
                });
    }

    private void BuildBoardingPassPage(PageDescriptor page, BoardingPass pass)
    {
        page.Size(PageSizes.A4);
        page.Margin(15);

        page.Content().Column(column =>
        {
            column.Item().Background("1a1a2e").Padding(20).Column(header =>
            {
                header.Spacing(5);
                header.Item().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("BOARDING PASS").FontSize(32).Bold().FontColor("ffffff");
                        c.Item().Text($"Flight {pass.FlightNumber}").FontSize(18).FontColor("00d4ff");
                    });

                    row.RelativeItem()
                        .AlignRight()
                        .Column(c =>
                        {
                            c.Item().Text("DEPARTURE").FontSize(9).FontColor("aaaaaa");
                            c.Item().Text(pass.DepartureTime.ToString("HH:mm")).FontSize(20).Bold().FontColor("ffffff");
                        });
                });
            });

            column.Item().Padding(20).Column(content =>
            {
                content.Spacing(15);

                content.Item().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("PASSENGER NAME").FontSize(8).SemiBold().FontColor("666666");
                        var fullName = pass.PassengerMiddleName != null
                            ? $"{pass.PassengerFirstName} {pass.PassengerMiddleName} {pass.PassengerLastName}"
                            : $"{pass.PassengerFirstName} {pass.PassengerLastName}";
                        c.Item().Text(fullName).FontSize(16).Bold().FontColor("1a1a2e");
                    });

                    row.RelativeItem()
                        .AlignRight()
                        .Column(c =>
                        {
                            c.Item().Text("SEAT").FontSize(8).SemiBold().FontColor("666666");
                            c.Item()
                                .Border(2).BorderColor("00d4ff")
                                .Padding(8)
                                .AlignCenter()
                                .Text(pass.SeatNumber).FontSize(24).Bold().FontColor("00d4ff");
                        });
                });

                content.Item().LineHorizontal(1).LineColor("eeeeee");

                content.Item().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("FROM").FontSize(8).SemiBold().FontColor("666666");
                        c.Item().Text(pass.DepartureCity).FontSize(14).Bold().FontColor("1a1a2e");
                        c.Item().Text(pass.DepartureTime.ToString("yyyy-MM-dd HH:mm")).FontSize(9).FontColor("999999");
                    });

                    row.RelativeItem()
                        .AlignCenter()
                        .Column(c =>
                        {
                            c.Item().Text("→").FontSize(20).FontColor("00d4ff");
                        });

                    row.RelativeItem()
                        .AlignRight()
                        .Column(c =>
                        {
                            c.Item().Text("TO").FontSize(8).SemiBold().FontColor("666666");
                            c.Item().Text(pass.ArrivalCity).FontSize(14).Bold().FontColor("1a1a2e");
                            c.Item().Text(pass.ArrivalTime.ToString("yyyy-MM-dd HH:mm")).FontSize(9).FontColor("999999");
                        });
                });

                content.Item().LineHorizontal(1).LineColor("eeeeee");

                content.Item().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("AIRCRAFT").FontSize(8).SemiBold().FontColor("666666");
                        c.Item().Text(pass.AirplaneModel).FontSize(11).Bold();
                    });

                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("CLASS").FontSize(8).SemiBold().FontColor("666666");
                        c.Item().Text(pass.IsBusiness ? "BUSINESS" : "ECONOMY").FontSize(11).Bold()
                            .FontColor(pass.IsBusiness ? "C9A961" : "666666");
                    });

                    row.RelativeItem()
                        .AlignRight()
                        .Column(c =>
                        {
                            c.Item().Text("PRICE").FontSize(8).SemiBold().FontColor("666666");
                            c.Item().Text($"${pass.Price:F2}").FontSize(12).Bold().FontColor("00d4ff");
                        });
                });

                content.Item().LineHorizontal(1).LineColor("eeeeee");

                content.Item().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        var services = new List<string>();
                        if (pass.HasLuggage) services.Add("✓ LUGGAGE");
                        if (pass.HasFood) services.Add("✓ MEAL");
                        if (pass.IsBusiness) services.Add("✓ BUSINESS");

                        foreach (var service in services)
                        {
                            c.Item().Text(service).FontSize(10).FontColor(service.Contains("BUSINESS") ? "C9A961" : "1a1a2e");
                        }
                    });

                    row.RelativeItem()
                        .AlignRight()
                        .Column(c =>
                        {
                            c.Item().Text("STATUS").FontSize(8).SemiBold().FontColor("666666");
                            c.Item().Text(pass.Status).FontSize(11).Bold()
                                .FontColor(pass.Status == "Confirmed" ? "00d4ff" : "ff6b6b");
                        });
                });
            });

            column.Item().Background("f5f5f5").Padding(15).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text($"Pass ID: {pass.Id:N}".Substring(0, 40)).FontSize(8).FontColor("999999");
                    c.Item().Text($"Booked: {pass.BookingCreatedAt:yyyy-MM-dd HH:mm}").FontSize(8).FontColor("999999");
                });

                row.RelativeItem()
                    .AlignRight()
                    .Column(c =>
                    {
                        c.Item().Text("Thank you for flying with us!").FontSize(9).Italic().FontColor("666666");
                    });
            });

            if (_qrImage is not null)
            {
                column.Item().PaddingTop(12).AlignCenter().Image(_qrImage).FitArea();
            }
        });
    }
}

public class BoardingPassGenerationResult
{
    public byte[] PdfBytes { get; set; } = [];
    public string ObjectName { get; set; } = string.Empty;
}

namespace Mail.Options;

public class EmailSettings
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 465;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "AirVibe";
    public string? ReplyTo { get; set; }
    public bool Enabled { get; set; } = true;
    public bool LogOnly { get; set; } = false;
}
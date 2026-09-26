using System.Text.RegularExpressions;

namespace Flights.Domain.Validators;

public static class DocumentValidators
{
    public static readonly Regex PassportSeriesRegex = new(@"^\d{4}$", RegexOptions.Compiled);
    public static readonly Regex PassportOrBirthCertificateNumberRegex = new(@"^\d{6}$", RegexOptions.Compiled);
    
    public static readonly Regex ForeignPassportSeriesRegex = new(@"^\d{2}$", RegexOptions.Compiled);
    public static readonly Regex ForeignPassportNumberRegex = new(@"^\d{8}$", RegexOptions.Compiled);

    public static readonly Regex BirthCertificateSeriesRegex = new(@"^(I{1,3}|IV|IX|X(I{0,3}|V|VI{0,2}|IX)|XX)-[А-Я]{2}$", RegexOptions.Compiled);
}
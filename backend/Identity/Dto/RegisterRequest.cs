using System.ComponentModel.DataAnnotations;

namespace Identity.Dto;

public class RegisterRequest
{
    public string Email { get; set; }
    [Required]
    public string Password { get; set; }
}
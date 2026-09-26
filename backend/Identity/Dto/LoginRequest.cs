using System.ComponentModel.DataAnnotations;

namespace Identity.Dto;

public class LoginRequest
{
    [Required]
    public string Email { get; set; }
    [Required]
    public string Password { get; set; }
}
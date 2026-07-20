
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.UserAccess;

public class AuthRequest
{
    [Required]
    public string User { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
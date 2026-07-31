
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.UserAccess;

public class ChangePasswordRequest
{
    [Required]
    [EmailAddress]
    public string email { get; set; } = string.Empty;

    [Required]
    public string password { get; set; } = string.Empty;
}

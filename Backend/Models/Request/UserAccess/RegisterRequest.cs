
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.UserAccess;

public class RegisterRequest
{

    [Required]
    public string lastNameTwo { get; set; } = string.Empty;

    [Required]
    public string lastName { get; set; } = string.Empty;

    [Required]
    public string password { get; set; } = string.Empty;

    [Required]
    public string email { get; set; } = string.Empty;

    [Required]
    public string? birthDate { get; set; }

    [Required]
    public string name { get; set; } = string.Empty;

    [Required]
    public string sex { get; set; } = string.Empty;

    [Required]
    public string user { get; set; } = string.Empty;    

}
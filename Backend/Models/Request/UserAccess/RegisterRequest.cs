
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.UserAccess;

public class RegisterRequest
{

    [Required]
    public string apellidoMaterno { get; set; } = string.Empty;

    [Required]
    public string apellidoPaterno { get; set; } = string.Empty;

    [Required]
    public string password { get; set; } = string.Empty;

    [Required]
    public string correo { get; set; } = string.Empty;

    [Required]
    public string? fechaNacimiento { get; set; }

    [Required]
    public string nombres { get; set; } = string.Empty;

    [Required]
    public string sexo { get; set; } = string.Empty;

    [Required]
    public string usuario { get; set; } = string.Empty;    

}
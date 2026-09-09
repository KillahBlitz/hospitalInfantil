namespace Backend.Models.Response.Platform;

public class RegisteredUsersResponse
{
    public List<RegisteredUser> Usuarios { get; set; } = new();
}

public class RegisteredUser
{
    public int Id { get; set; }
    public short TipoId { get; set; }
    public string Nombre { get; set; } = null!;
    public string ApellidoPaterno { get; set; } = null!;
    public string ApellidoMaterno { get; set; } = null!;
    public DateOnly FechaNacimiento { get; set; }
    public string Sexo { get; set; } = null!;
    public DateOnly FechaIngreso { get; set; }
    public string Alias { get; set; } = null!;
    public string Correo { get; set; } = null!;
    public bool Activo { get; set; }
}


namespace Backend.Models.Response.Platform;

public class UsersRequestResponse
{
    public List<Solicitud>? Solicitudes { get; set; }
}

public class Solicitud
{
    public int Id { get; set; }

    public string Usuario { get; set; } = null!;
    public string Nombre { get; set; } = null!;

    public string ApellidoPaterno { get; set; } = null!;

    public string ApellidoMaterno { get; set; } = null!;

    public DateOnly FechaIngreso { get; set; }

    public string Correo { get; set; } = null!;

    public bool Aprobado { get; set; }
}
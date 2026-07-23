namespace Backend.Models.Response.UserAccess;

public class AuthResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Alias { get; set; } = null!;
    public string Correo { get; set; } = null!;
    public Dictionary<string, Dictionary<int, List<int>>> Accesos { get; set; } = new();
}

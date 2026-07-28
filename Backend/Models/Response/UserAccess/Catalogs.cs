namespace Backend.Models.Response.UserAccess;

public class AreasResponse
{
    public Dictionary<int, string> Areas { get; set; } = new();
}

public class AccessResponse
{
    public Dictionary<int, string> Permisos { get; set; } = new();
}
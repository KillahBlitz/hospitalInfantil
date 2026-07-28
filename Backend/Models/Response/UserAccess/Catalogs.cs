namespace Backend.Models.Response.UserAccess;

public class AreasResponse
{
    public Dictionary<string, int> Areas { get; set; } = new();
}

public class AccessResponse
{
    public Dictionary<int, string> Permisos { get; set; } = new();
}
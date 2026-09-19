namespace Backend.Models.Response.HumanResources;

public class AreasResponse
{
    public List<AreaItem> Areas { get; set; } = new();
}

public class AreaItem
{
    public int Id { get; set; }
    public string? ClaveArea { get; set; }
    public string Descripcion { get; set; } = null!;
}

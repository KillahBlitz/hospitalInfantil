namespace Backend.Models.Response.HumanResources;

public class PuestosResponse
{
    public List<PuestoItem> Puestos { get; set; } = new();
}

public class PuestoItem
{
    public int Id { get; set; }
    public string CodigoPuesto { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public string? GradoSalarial { get; set; }
    public short? RangoSalarial { get; set; }
}

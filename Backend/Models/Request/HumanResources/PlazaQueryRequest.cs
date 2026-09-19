namespace Backend.Models.Request.HumanResources;

public class PlazaQueryRequest
{
    public int Pagina { get; set; } = 1;

    public int Tamano { get; set; } = 10;

    public string? Texto { get; set; }

    public int? AreaId { get; set; }

    public int? PuestoId { get; set; }

    public int? TipoContratacionId { get; set; }

    public bool? Ocupabilidad { get; set; }

    public DateOnly? FechaVacancia { get; set; }
}

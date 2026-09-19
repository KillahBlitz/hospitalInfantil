namespace Backend.Models.Response.HumanResources;

public class PlazasResponse
{
    public int Pagina { get; set; }
    public int Tamano { get; set; }
    public int Total { get; set; }
    public int TotalPaginas { get; set; }
    public List<PlazaItem> Plazas { get; set; } = new();
}

public class PlazaItem
{
    public int Id { get; set; }
    public string ClavePlaza { get; set; } = null!;
    public string CodigoPuesto { get; set; } = null!;
    public string DescripcionPuesto { get; set; } = null!;
    public string? GradoSalarial { get; set; }
    public string? DenominacionPuesto { get; set; }
    public int PuestoId { get; set; }
    public int TipoContratacionId { get; set; }
    public int? TipoPlazaId { get; set; }
    public int UnidadId { get; set; }
    public int? AreaId { get; set; }
    public string? ClaveArea { get; set; }
    public string? Area { get; set; }
    public string TipoContratacion { get; set; } = null!;
    public string? TipoPlaza { get; set; }
    public string Unidad { get; set; } = null!;
    public bool Ocupabilidad { get; set; }
    public DateOnly? FechaVacancia { get; set; }
    public short? CantidadPlazaHora { get; set; }
    public string? CodigoSHCP { get; set; }
    public string? CodigoFederalPuesto { get; set; }
    public string? ClavePresupuestalActual { get; set; }
}

public class TiposContratacionResponse
{
    public List<TipoContratacionItem> TiposContratacion { get; set; } = new();
}

public class TipoContratacionItem
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = null!;
}

public class UnidadesResponse
{
    public List<UnidadItem> Unidades { get; set; } = new();
}

public class UnidadItem
{
    public int Id { get; set; }
    public string Unidad { get; set; } = null!;
    public string? Ramo { get; set; }
    public string? ZE { get; set; }
}

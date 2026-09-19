namespace Backend.Models.Request.HumanResources;

public class PlazaRequest
{
    public string? ClavePlaza { get; set; }

    public int? PuestoId { get; set; }

    public int? AreaId { get; set; }

    public int? TipoContratacionId { get; set; }

    public int? TipoPlazaId { get; set; }

    public int? UnidadId { get; set; }

    public string? DenominacionPuesto { get; set; }

    public short? CantidadPlazaHora { get; set; }

    public bool Ocupabilidad { get; set; }

    public DateOnly? FechaVacancia { get; set; }

    public string? CodigoSHCP { get; set; }

    public string? CodigoFederalPuesto { get; set; }

    public string? ClavePresupuestalActual { get; set; }
}

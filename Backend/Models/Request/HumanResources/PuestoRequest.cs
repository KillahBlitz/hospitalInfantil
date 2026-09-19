using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.HumanResources;

public class PuestoRequest
{
    public string? CodigoPuesto { get; set; }

    public string? Descripcion { get; set; }

    public string? GradoSalarial { get; set; }

    public short? RangoSalarial { get; set; }
}

public class UploadPuestosRequest
{
    [Required]
    [MinLength(1)]
    public List<PuestoRequest> Puestos { get; set; } = new();
}

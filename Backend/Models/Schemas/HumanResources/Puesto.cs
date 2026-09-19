using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Puesto
{
    public int Id { get; set; }

    public int AreaId { get; set; }

    public string Descripcion { get; set; } = null!;

    public string CodigoPuesto { get; set; } = null!;

    public string? GradoSalarial { get; set; }

    public decimal? RangoSalarial { get; set; }

    public virtual Area Area { get; set; } = null!;

    public virtual ICollection<Plaza> Plazas { get; set; } = new List<Plaza>();
}

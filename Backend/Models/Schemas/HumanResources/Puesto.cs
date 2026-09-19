using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Puesto
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = null!;

    public string CodigoPuesto { get; set; } = null!;

    public string? GradoSalarial { get; set; }

    public short? RangoSalarial { get; set; }

    public virtual ICollection<Plaza> Plazas { get; set; } = new List<Plaza>();
}

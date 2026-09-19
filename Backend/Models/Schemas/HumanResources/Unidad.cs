using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Unidad
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Ramo { get; set; }

    public string? ZE { get; set; }

    public virtual ICollection<Plaza> Plazas { get; set; } = new List<Plaza>();
}

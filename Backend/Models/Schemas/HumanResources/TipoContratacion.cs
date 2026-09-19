using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class TipoContratacion
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = null!;

    public virtual ICollection<Plaza> Plazas { get; set; } = new List<Plaza>();
}

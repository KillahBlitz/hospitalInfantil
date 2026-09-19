using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Area
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = null!;

    public virtual ICollection<Puesto> Puestos { get; set; } = new List<Puesto>();
}

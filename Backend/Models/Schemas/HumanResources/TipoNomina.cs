using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class TipoNomina
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = null!;

    public virtual ICollection<Nomina> Nominas { get; set; } = new List<Nomina>();
}

using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class TipoRelacion
{
    public int IdTipoRelacion { get; set; }

    public string? NomRelacion { get; set; }

    public virtual ICollection<ComplementoPagoDetallado> ComplementosPagoDetallados { get; set; } = new List<ComplementoPagoDetallado>();
}
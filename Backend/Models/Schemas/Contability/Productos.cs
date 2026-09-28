using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Productos
{
    public int IdProducto { get; set; }

    public string? NomProducto { get; set; }

    public virtual ICollection<ComplementoPagoDetallado> ComplementosPagoDetallados { get; set; } = new List<ComplementoPagoDetallado>();
}
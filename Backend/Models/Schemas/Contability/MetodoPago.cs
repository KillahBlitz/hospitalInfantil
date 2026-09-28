using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class MetodoPago
{
    public int IdMetodoPago { get; set; }

    public string? TipoMetodoPago { get; set; }

    public string? DescripcionMetodo { get; set; }

    public virtual ICollection<ComplementoPago> ComplementosPago { get; set; } = new List<ComplementoPago>();
}
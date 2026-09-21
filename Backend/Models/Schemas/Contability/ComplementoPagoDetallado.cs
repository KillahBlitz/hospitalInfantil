using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;
public partial class ComplementoPagoDetallado
{
    public int IdComplementoPagoDetallado { get; set; }

    public int? IdComplementoPago { get; set; }

    public string? UuidRelacionales { get; set; }

    public int? IdFactura { get; set; }

    public int? IdProducto { get; set; }

    public int? IdTipoRelacion { get; set; }

    public string? Concepto { get; set; }

    public int? Periodo { get; set; }

    public decimal? MontoTotal { get; set; }
}
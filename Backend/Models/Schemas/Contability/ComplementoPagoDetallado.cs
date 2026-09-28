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

    public virtual ComplementoPago? ComplementoPago { get; set; }

    public virtual Factura? Factura { get; set; }

    public virtual Productos? Producto { get; set; }

    public virtual TipoRelacion? TipoRelacion { get; set; }
}
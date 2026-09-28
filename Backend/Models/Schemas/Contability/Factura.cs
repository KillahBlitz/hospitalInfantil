using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Factura
{
    public int IdFactura { get; set; }

    public int? Serie { get; set; }

    public string? FolioFiscal { get; set; }

    public int? IdProveedor { get; set; }

    public decimal? ImporteFactura { get; set; }

    public string? Estatus { get; set; }

    public int? IdNumeroContrato { get; set; }

    public virtual Proveedor? Proveedor { get; set; }

    public virtual Contrato? Contrato { get; set; }

    public virtual ICollection<Contrato> ContratosConEstaFactura { get; set; } = new List<Contrato>();

    public virtual ICollection<ComplementoPagoDetallado> ComplementosPagoDetallados { get; set; } = new List<ComplementoPagoDetallado>();

    public virtual ICollection<MovimientoFactura> MovimientosFacturas { get; set; } = new List<MovimientoFactura>();
}
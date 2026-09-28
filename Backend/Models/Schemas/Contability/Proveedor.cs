using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Proveedor
{
    public int IdProveedor { get; set; }

    public string NombreProveedor { get; set; } = null!;

    public virtual ICollection<CuentaBancaria> CuentasBancarias { get; set; } = new List<CuentaBancaria>();

    public virtual ICollection<Factura> Facturas { get; set; } = new List<Factura>();

    public virtual ICollection<MovimientoContable> MovimientosContables { get; set; } = new List<MovimientoContable>();

    public virtual ICollection<ComplementoPago> ComplementosPago { get; set; } = new List<ComplementoPago>();
}

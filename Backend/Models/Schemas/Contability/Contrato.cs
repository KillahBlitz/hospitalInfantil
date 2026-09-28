using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Contrato
{
    public int IdNumeroContrato { get; set; }

    public int ClaveArea { get; set; } 

    public int? AñoContrato { get; set; }

    public int? IdFactura { get; set; }

    public virtual Clave? Clave { get; set; }

    public virtual Factura? Factura { get; set; }

    public virtual ICollection<Factura> FacturasAsociadas { get; set; } = new List<Factura>();

    public virtual ICollection<MovimientoContable> MovimientosContables { get; set; } = new List<MovimientoContable>();
}
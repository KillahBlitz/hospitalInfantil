using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class MovimientoFactura
{
    public int IdMovimientoFactura { get; set; }

    public int IdMovimientoContable { get; set; }

    public int? IdFactura { get; set; }

    public int? Periodo { get; set; }

    public int? Año { get; set; }

    public DateOnly? Fecha { get; set; }
}
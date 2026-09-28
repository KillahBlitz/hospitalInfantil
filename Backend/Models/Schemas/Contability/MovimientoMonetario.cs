using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class MovimientoMonetario
{
    public int IdMovimientoMonetario { get; set; }

    public string? NombreCA { get; set; }

    public decimal? Monto { get; set; }

    public virtual ICollection<MovimientoContable> MovimientosContables { get; set; } = new List<MovimientoContable>();
}
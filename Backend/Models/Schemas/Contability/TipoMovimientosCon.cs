using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class TipoMovimientosCon
{
    public int IdTipoMovimientosCon {get; set;}

    public string? TipoMovimiento {get; set;}

    public bool? Egreso {get; set;}

    public bool? Diario {get; set;}
}
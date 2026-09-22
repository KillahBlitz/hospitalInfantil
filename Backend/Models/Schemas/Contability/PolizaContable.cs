using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class PolizaContable
{
    public int IdPoliza {get; set;}

    public int? IdMovimiento {get; set;}

    public DateOnly FechaInicio {get; set;}

    public DateOnly? FechaFinal {get; set; }
    
    public int? CapituloGasto {get; set;}

    public int? Pp {get; set;}

    public int? Clc {get; set;}
}
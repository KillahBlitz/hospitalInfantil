using System;
using System.Collections.Generic;
using System.Data.Common;

namespace Backend.Models.Schemas.Contability;

public partial class MetodoPago
{
    public int IdMetodoPago {get; set;}

    public string? TipoMetodoPago {get; set;}

    public string? DescripcionMetodo {get; set;}
}
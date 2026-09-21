using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Clave
{
    public int IdClave { get; set; }

    public string? DesClaveArea {get; set;} = null!;
}
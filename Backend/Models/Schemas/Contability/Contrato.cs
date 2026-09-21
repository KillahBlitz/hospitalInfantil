using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Contrato
{
    public int IdNumeroContrato { get; set; }

    public int ClaveArea {get; set;} 

    public int? AñoContrato {get; set;}

    public int? IdFactura {get; set;}
}
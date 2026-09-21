using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Proveedor
{
    public int IdProveedor { get; set; }

    public string NombreProveedor { get; set; } = null!;
    
}

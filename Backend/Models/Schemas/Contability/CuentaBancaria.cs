using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class CuentaBancaria
{
    public int IdCuentaBancaria { get; set; }

    public int IdProveedor { get; set; }

    public int NumeroCuenta { get; set; }

    public string? Banco { get; set; }

    public int ClaveInterbancaria { get; set; }
}
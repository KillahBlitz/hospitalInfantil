using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Clave
{
    public int IdClave { get; set; }

    public string DesClaveArea { get; set; } = null!;

    public virtual ICollection<Contrato> Contratos { get; set; } = new List<Contrato>();
}
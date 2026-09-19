using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class CatalogoImpuesto
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = null!;

    public decimal ValorImpuesto { get; set; }
}

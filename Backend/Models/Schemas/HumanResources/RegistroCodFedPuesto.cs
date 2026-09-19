using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class RegistroCodFedPuesto
{
    public int Id { get; set; }

    public int PlazaId { get; set; }

    public string CodigoFederalPuesto { get; set; } = null!;

    public DateOnly FechaActualizacion { get; set; }

    public virtual Plaza Plaza { get; set; } = null!;
}

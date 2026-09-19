using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Comentario
{
    public int Id { get; set; }

    public int EmpleadoId { get; set; }

    public int NumeroComentario { get; set; }

    public string Texto { get; set; } = null!;

    public string? TipoComentario { get; set; }

    public virtual Empleado Empleado { get; set; } = null!;
}

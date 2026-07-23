using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.UserAccess;

public partial class Area
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }

    public virtual ICollection<Modulo> Modulos { get; set; } = new List<Modulo>();
}

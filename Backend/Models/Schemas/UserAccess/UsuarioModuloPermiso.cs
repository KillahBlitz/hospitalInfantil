using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.UserAccess;

public partial class UsuarioModuloPermiso
{
    public int UsuarioId { get; set; }

    public int ModuloId { get; set; }

    public int PermisoId { get; set; }

    public virtual Modulo Modulo { get; set; } = null!;

    public virtual Permiso Permiso { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}

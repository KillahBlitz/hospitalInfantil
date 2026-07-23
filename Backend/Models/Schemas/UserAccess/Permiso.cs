using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.UserAccess;

public partial class Permiso
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string Descripcion { get; set; } = null!;

    public virtual ICollection<UsuarioModuloPermiso> UsuarioModuloPermisos { get; set; } = new List<UsuarioModuloPermiso>();
}

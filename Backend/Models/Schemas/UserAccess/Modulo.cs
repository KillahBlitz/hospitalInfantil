using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.UserAccess;

public partial class Modulo
{
    public int Id { get; set; }

    public int AreaId { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }

    public virtual Area Area { get; set; } = null!;

    public virtual ICollection<UsuarioModuloPermiso> UsuarioModuloPermisos { get; set; } = new List<UsuarioModuloPermiso>();
}

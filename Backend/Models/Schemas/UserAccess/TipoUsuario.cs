using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.UserAccess;

public partial class TipoUsuario
{
    public short Id { get; set; }

    public string NivelUsuario { get; set; } = null!;

    public string Descripcion { get; set; } = null!;

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}

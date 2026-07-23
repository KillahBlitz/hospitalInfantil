using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.UserAccess;

public partial class Usuario
{
    public int Id { get; set; }

    public short TipoId { get; set; }

    public string Nombre { get; set; } = null!;

    public string ApellidoPaterno { get; set; } = null!;

    public string ApellidoMaterno { get; set; } = null!;

    public DateOnly FechaNacimiento { get; set; }

    public string Sexo { get; set; } = null!;

    public DateOnly FechaIngreso { get; set; }

    public string Alias { get; set; } = null!;

    public string Correo { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool Activo { get; set; }

    public virtual TipoUsuario Tipo { get; set; } = null!;

    public virtual ICollection<UsuarioModuloPermiso> UsuarioModuloPermisos { get; set; } = new List<UsuarioModuloPermiso>();
}

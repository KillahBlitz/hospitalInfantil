using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.Platform;

public class ApproveUserRequest
{
    [Required]
    public int SolicitudId { get; set; }

    [Required]
    public short TipoId { get; set; }

    [Required]
    public List<ModulePermissionRequest> Permisos { get; set; } = new();
}

public class ModulePermissionRequest
{
    [Required]
    public int ModuloId { get; set; }

    [Required]
    public List<int> PermisosIds { get; set; } = new();
}

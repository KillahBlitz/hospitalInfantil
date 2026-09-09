using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.Platform;

public class UpdateUserPermissionsRequest
{
    [Required]
    public int UserId { get; set; }

    [Required]
    public short TipoId { get; set; }

    [Required]
    public List<ModulePermissionRequest> Permisos { get; set; } = new();
}

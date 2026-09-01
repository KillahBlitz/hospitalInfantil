using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.Platform;

public class ApproveRequestRequest
{
    [Required]
    public int RequestId { get; set; }

    [Required]
    public short TypeId { get; set; }

    [Required, MinLength(1, ErrorMessage = "Debe asignarse al menos un módulo.")]
    public List<ModuleAccess> Access { get; set; } = new();
}

public class ModuleAccess
{
    [Required]
    public int ModuleId { get; set; }

    [Required, MinLength(1, ErrorMessage = "Debe asignarse al menos un permiso por módulo.")]
    public List<int> PermissionIds { get; set; } = new();
}
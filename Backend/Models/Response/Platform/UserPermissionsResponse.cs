using System.Collections.Generic;

namespace Backend.Models.Response.Platform;

public class UserPermissionsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public short TipoId { get; set; }
    public List<UserPermissionItem> Permisos { get; set; } = new();
}

public class UserPermissionItem
{
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int ModuloId { get; set; }
    public string ModuloName { get; set; } = string.Empty;
    public List<int> PermisosIds { get; set; } = new();
}

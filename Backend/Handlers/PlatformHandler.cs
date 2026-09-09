using Backend.Models.Repositories;
using Backend.Models.Request.Platform;
using Backend.Models.Response.Platform;

namespace Backend.Handlers;

public class PlatformHandler
{
    private readonly UserAccessRepository _repository;

    public PlatformHandler(UserAccessRepository repository)
    {
        _repository = repository;
    }

    public async Task<RegisteredUsersResponse> GetRegisteredUsers()
    {
        var users = await _repository.GetAllRegisteredUsers();

        return new RegisteredUsersResponse
        {
            Usuarios = users.Select(user => new RegisteredUser
            {
                Id = user.Id,
                TipoId = user.TipoId,
                Nombre = user.Nombre,
                ApellidoPaterno = user.ApellidoPaterno,
                ApellidoMaterno = user.ApellidoMaterno,
                FechaNacimiento = user.FechaNacimiento,
                Sexo = user.Sexo,
                FechaIngreso = user.FechaIngreso,
                Alias = user.Alias,
                Correo = user.Correo,
                Activo = user.Activo
            }).ToList()
        };
    }

    public async Task<DeactivateUserResponse> DeactivateUser(
        int userId, int actorId, CancellationToken cancellationToken = default)
    {
        var result = await _repository.DeactivateUser(userId, actorId, cancellationToken);
        return result switch
        {
            UserDeactivationStatus.Success => new()
            {
                Success = true, Code = "success",
                Message = "Usuario dado de baja y trasladado a solicitudes correctamente."
            },
            UserDeactivationStatus.NotFound => new()
            {
                Code = "not_found", Message = "El usuario ya no está registrado. Actualiza la lista."
            },
            UserDeactivationStatus.Conflict => new()
            {
                Code = "conflict",
                Message = "El alias o correo pertenece a otra solicitud. Resuelve el conflicto antes de dar de baja al usuario."
            },
            _ => new()
            {
                Code = "forbidden", Message = "No tienes permiso para editar cuentas."
            }
        };
    }

    public async Task<UsersRequestResponse?> GetAllUsers()
    {
        List<Solicitud> solicitudes = new List<Solicitud>();
        var users = await _repository.GetAllUsersRequest();
        foreach (var user in users)
        {
            Solicitud solicitud = new Solicitud
            {
                Id = user.Id,
                Usuario = user.Username,
                Nombre = user.Nombre,
                ApellidoPaterno = user.ApellidoPaterno,
                ApellidoMaterno = user.ApellidoMaterno,
                FechaIngreso = user.FechaIngreso,
                Correo = user.Correo,
                Aprobado = user.Aprobado,
                Comentario = user.Comentario
            };
            solicitudes.Add(solicitud);
        }
        return new UsersRequestResponse
        {
            Solicitudes = solicitudes
        };
    }

    public async Task<bool> UpdateComment(int requestId, string? comment, int actorId, CancellationToken cancellationToken = default)
    {
        return await _repository.UpdateUserRequestComment(requestId, comment, actorId, cancellationToken);
    }

    public async Task<DeactivateUserResponse> ApproveUserAsync(Backend.Models.Request.Platform.ApproveUserRequest request, int actorId, CancellationToken cancellationToken = default)
    {
        var result = await _repository.ApproveUserTransactionAsync(request, actorId, cancellationToken);
        return result switch
        {
            "success" => new DeactivateUserResponse
            {
                Success = true, Code = "success",
                Message = "Usuario aprobado y permisos guardados."
            },
            "not_found" => new DeactivateUserResponse
            {
                Code = "not_found", Message = "La solicitud no fue encontrada o ya fue aprobada."
            },
            "conflict" => new DeactivateUserResponse
            {
                Code = "conflict",
                Message = "El alias o correo pertenece a un usuario existente."
            },
            _ => new DeactivateUserResponse
            {
                Code = "forbidden", Message = "No tienes permiso para editar cuentas."
            }
        };
    }
    public async Task<UserPermissionsResponse> GetUserPermissionsAsync(int userId)
    {
        var usuario = await _repository.GetUserPermissionsAdminAsync(userId);
        if (usuario is null || !usuario.Activo)
        {
            return new UserPermissionsResponse { Success = false, Message = "Usuario no encontrado", Code = "not_found" };
        }

        var response = new UserPermissionsResponse
        {
            Success = true,
            Code = "success",
            TipoId = usuario.TipoId,
            Permisos = usuario.UsuarioModuloPermisos
                .GroupBy(p => new { p.Modulo.AreaId, AreaName = p.Modulo.Area.Nombre, p.ModuloId, ModuloName = p.Modulo.Nombre })
                .Select(g => new UserPermissionItem
                {
                    AreaId = g.Key.AreaId,
                    AreaName = g.Key.AreaName,
                    ModuloId = g.Key.ModuloId,
                    ModuloName = g.Key.ModuloName,
                    PermisosIds = g.Select(p => p.PermisoId).ToList()
                })
                .ToList()
        };

        return response;
    }

    public async Task<DeactivateUserResponse> UpdateUserPermissionsAsync(UpdateUserPermissionsRequest request, int actorId, CancellationToken cancellationToken = default)
    {
        var result = await _repository.UpdateUserPermissionsTransactionAsync(request.UserId, request, actorId, cancellationToken);
        return result switch
        {
            "success" => new DeactivateUserResponse
            {
                Success = true, Code = "success",
                Message = "Permisos actualizados correctamente."
            },
            "not_found" => new DeactivateUserResponse
            {
                Code = "not_found", Message = "El usuario no fue encontrado o está inactivo."
            },
            _ => new DeactivateUserResponse
            {
                Code = "forbidden", Message = "No tienes permiso para editar permisos."
            }
        };
    }
}


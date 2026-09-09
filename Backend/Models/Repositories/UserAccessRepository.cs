using System.Data;
using Backend.Data;
using Backend.Models.Request.UserAccess;
using Backend.Models.Request.Platform;
using Backend.Models.Schemas.UserAccess;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models.Repositories;

public class UserAccessRepository
{
    private readonly UserAccessDbContext _context;

    public UserAccessRepository(UserAccessDbContext context)
    {
        _context = context;
    }

    public async Task<Usuario?> GetUserAuth(string alias)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Alias == alias && u.Activo);
    }

    public async Task<bool> GetUserKeyAuth(string alias, string correo)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Alias == alias && u.Correo == correo);
        var usuarioPeticion = await _context.SolicitudUsuarios
            .FirstOrDefaultAsync(u => u.Username == alias || u.Correo == correo);
        if (usuarioPeticion != null || usuarioPeticion != null)
        {
            return true;
        }
        return false;
    }

    public async Task<SolicitudUsuario> CreateUserSolicitado(RegisterRequest request, string passwordHash, DateOnly fechaNacimiento)
    {

        var newUserSolicitado = new SolicitudUsuario
        {
            Nombre = request.name,
            ApellidoPaterno = request.lastName,
            ApellidoMaterno = request.lastNameTwo,
            Sexo = request.sex,
            FechaNacimiento = fechaNacimiento,
            Username = request.user,
            Correo = request.email,
            PasswordHash = passwordHash,
            Aprobado = false,
            FechaIngreso = DateOnly.FromDateTime(DateTime.Now)
        };

        _context.SolicitudUsuarios.Add(newUserSolicitado);
        await _context.SaveChangesAsync();

        return newUserSolicitado;
    }

    public async Task<List<Dictionary<string, List<Dictionary<int, List<int>>>>>> GetAccess(int usuarioId)
    {
        var permisos = await _context.UsuarioModuloPermisos
            .Include(ump => ump.Modulo)
                .ThenInclude(m => m.Area)
            .Include(ump => ump.Permiso)
            .Where(ump => ump.UsuarioId == usuarioId)
            .ToListAsync();

        return permisos
            .GroupBy(p => p.Modulo.Area.Nombre)
            .Select(areaGroup => new Dictionary<string, List<Dictionary<int, List<int>>>>
            {
                [areaGroup.Key] = areaGroup
                    .GroupBy(p => p.Modulo.Id)
                    .Select(moduloGroup => new Dictionary<int, List<int>>
                    {
                        [moduloGroup.Key] = moduloGroup.Select(p => p.Permiso.Id).ToList()
                    })
                    .ToList()
            })
            .ToList();
    }

    public async Task<List<Area>> GetAreasById(List<int> areasId)
    {
        var areas = await _context.Areas
            .Where(a => areasId.Contains(a.Id) && a.Activo)
            .ToListAsync();

        return areas;
    }

    public async Task<List<TipoUsuario>> GetUserTypes()
    {
        return await _context.TipoUsuarios.ToListAsync();
    }

    public async Task<List<Area>> GetAreas()
    {
        var areas = await _context.Areas
            .Where(a => a.Activo)
            .ToListAsync();

        return areas;
    }

    public async Task<List<Permiso>> GetPermisos()
    {
        var permisos = await _context.Permisos
            .ToListAsync();

        return permisos;
    }

    public async Task<List<Modulo>> GetModulos(List<int> areasId)
    {
        var modulos = await _context.Modulos
            .Where(m => areasId.Contains(m.AreaId) && m.Activo)
            .ToListAsync();
        return modulos;
    }

    public async Task<List<SolicitudUsuario>> GetAllUsersRequest()
    {
        var solicitudes = await _context.SolicitudUsuarios
            .ToListAsync();
        return solicitudes;
    }

    public async Task<List<Usuario>> GetAllRegisteredUsers()
    {
        return await _context.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.Nombre)
            .ThenBy(u => u.ApellidoPaterno)
            .ThenBy(u => u.Id)
            .ToListAsync();
    }

    public async Task<UserDeactivationStatus> DeactivateUser(
        int usuarioId, int actorId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);

        // El módulo 1 corresponde a configuración de cuentas en MODULE_REGISTRY.
        // La identidad proviene del token; los permisos se consultan dentro de la transacción.
        var canEdit = await _context.UsuarioModuloPermisos.AnyAsync(access =>
            access.UsuarioId == actorId && access.Usuario.Activo &&
            access.ModuloId == 1 && access.Modulo.Activo && access.Modulo.Area.Activo &&
            access.Permiso.Nombre.Trim().ToLower() == "editar", cancellationToken);
        if (!canEdit) return UserDeactivationStatus.Forbidden;

        var usuario = await _context.Usuarios.SingleOrDefaultAsync(
            user => user.Id == usuarioId, cancellationToken);
        if (usuario is null) return UserDeactivationStatus.NotFound;

        // Comparar con la collation de SQL, no con una comparación distinta en memoria.
        var matches = await _context.SolicitudUsuarios
            .Where(request => request.Username == usuario.Alias || request.Correo == usuario.Correo)
            .Select(request => new
            {
                Request = request,
                SameIdentity = request.Username == usuario.Alias && request.Correo == usuario.Correo
            })
            .ToListAsync(cancellationToken);
        if (matches.Count > 1 || matches.Any(match => !match.SameIdentity))
            return UserDeactivationStatus.Conflict;

        var solicitud = matches.SingleOrDefault()?.Request;
        if (solicitud is null)
        {
            solicitud = new SolicitudUsuario();
            _context.SolicitudUsuarios.Add(solicitud);
        }

        solicitud.Nombre = usuario.Nombre;
        solicitud.ApellidoPaterno = usuario.ApellidoPaterno;
        solicitud.ApellidoMaterno = usuario.ApellidoMaterno;
        solicitud.FechaNacimiento = usuario.FechaNacimiento;
        solicitud.Sexo = usuario.Sexo;
        solicitud.FechaIngreso = usuario.FechaIngreso;
        solicitud.Username = usuario.Alias;
        solicitud.Correo = usuario.Correo;
        solicitud.PasswordHash = usuario.PasswordHash;
        solicitud.Aprobado = false;
        solicitud.Comentario = "usario previamente registrado";

        // Persistir la copia antes de eliminar dependencias, siempre en la misma transacción.
        await _context.SaveChangesAsync(cancellationToken);
        var permissions = await _context.UsuarioModuloPermisos
            .Where(access => access.UsuarioId == usuarioId)
            .ToListAsync(cancellationToken);
        _context.UsuarioModuloPermisos.RemoveRange(permissions);
        await _context.SaveChangesAsync(cancellationToken);

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return UserDeactivationStatus.Success;
    }

    public async Task<Usuario?> GetUserByEmail(string correo)
    {
        return await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == correo);
    }

    public async Task<bool> UpdatePassword(Usuario usuario, string passwordHash)
    {
        usuario.PasswordHash = passwordHash;
        _context.Usuarios.Update(usuario);
        var affected = await _context.SaveChangesAsync();
        return affected > 0;
    }

    public async Task<bool> UpdateUserRequestComment(int requestId, string? comment, int actorId, CancellationToken cancellationToken = default)
    {
        var canCreate = await _context.UsuarioModuloPermisos.AnyAsync(access =>
            access.UsuarioId == actorId && access.Usuario.Activo &&
            access.ModuloId == 1 && access.Modulo.Activo && access.Modulo.Area.Activo &&
            access.Permiso.Nombre.Trim().ToLower() == "crear", cancellationToken);
            
        if (!canCreate) throw new UnauthorizedAccessException("No tienes permiso para actualizar comentarios.");

        var request = await _context.SolicitudUsuarios.FindAsync(new object[] { requestId }, cancellationToken);
        if (request == null) return false;

        request.Comentario = comment;
        _context.SolicitudUsuarios.Update(request);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<string> ApproveUserTransactionAsync(ApproveUserRequest request, int actorId, CancellationToken cancellationToken)
    {
        // 1. Verify actor has 'editar' permission
        var canEdit = await _context.UsuarioModuloPermisos.AnyAsync(access =>
            access.UsuarioId == actorId && access.Usuario.Activo &&
            access.ModuloId == 1 && access.Modulo.Activo && access.Modulo.Area.Activo &&
            access.Permiso.Nombre.Trim().ToLower() == "editar", cancellationToken);
        if (!canEdit) return "forbidden";

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        // 2. Find request
        var solicitud = await _context.SolicitudUsuarios.FindAsync(new object[] { request.SolicitudId }, cancellationToken);
        if (solicitud is null || solicitud.Aprobado)
            return "not_found"; // Ya fue aprobada o no existe

        // 3. Verify no existing user conflicts
        var existingUser = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Alias == solicitud.Username || u.Correo == solicitud.Correo, cancellationToken);
        if (existingUser != null)
            return "conflict";

        // 4. Create new user
        var nuevoUsuario = new Usuario
        {
            TipoId = request.TipoId,
            Nombre = solicitud.Nombre,
            ApellidoPaterno = solicitud.ApellidoPaterno,
            ApellidoMaterno = solicitud.ApellidoMaterno,
            FechaNacimiento = solicitud.FechaNacimiento,
            Sexo = solicitud.Sexo,
            FechaIngreso = solicitud.FechaIngreso,
            Alias = solicitud.Username,
            Correo = solicitud.Correo,
            PasswordHash = solicitud.PasswordHash,
            Activo = true
        };

        _context.Usuarios.Add(nuevoUsuario);
        await _context.SaveChangesAsync(cancellationToken); // Save to get the new Id

        // 5. Add permissions
        foreach (var permisoReq in request.Permisos)
        {
            foreach (var permisoId in permisoReq.PermisosIds)
            {
                _context.UsuarioModuloPermisos.Add(new UsuarioModuloPermiso
                {
                    UsuarioId = nuevoUsuario.Id,
                    ModuloId = permisoReq.ModuloId,
                    PermisoId = permisoId
                });
            }
        }

        // 6. Mark request as approved
        solicitud.Aprobado = true;
        
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return "success";
    }
    public async Task<Usuario?> GetUserPermissionsAdminAsync(int userId)
    {
        return await _context.Usuarios
            .Include(u => u.UsuarioModuloPermisos)
                .ThenInclude(ump => ump.Modulo)
                    .ThenInclude(m => m.Area)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<string> UpdateUserPermissionsTransactionAsync(int userId, UpdateUserPermissionsRequest request, int actorId, CancellationToken cancellationToken)
    {
        var canEdit = await _context.UsuarioModuloPermisos.AnyAsync(access =>
            access.UsuarioId == actorId && access.Usuario.Activo &&
            access.ModuloId == 1 && access.Modulo.Activo && access.Modulo.Area.Activo &&
            access.Permiso.Nombre.Trim().ToLower() == "editar", cancellationToken);
        if (!canEdit) return "forbidden";

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var usuario = await _context.Usuarios
            .Include(u => u.UsuarioModuloPermisos)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            
        if (usuario is null || !usuario.Activo)
            return "not_found";

        // Remove old permissions
        _context.UsuarioModuloPermisos.RemoveRange(usuario.UsuarioModuloPermisos);
        
        // Update user type
        usuario.TipoId = request.TipoId;

        // Add new permissions
        foreach (var permisoReq in request.Permisos)
        {
            foreach (var permisoId in permisoReq.PermisosIds)
            {
                _context.UsuarioModuloPermisos.Add(new UsuarioModuloPermiso
                {
                    UsuarioId = usuario.Id,
                    ModuloId = permisoReq.ModuloId,
                    PermisoId = permisoId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return "success";
    }
}


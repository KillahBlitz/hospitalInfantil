using System.Globalization;
using Backend.Data;
using Backend.Models.Request.UserAccess;
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

    public async Task<Dictionary<string, Dictionary<int, List<int>>>> GetAccess(int usuarioId)
    {
        var permisos = await _context.UsuarioModuloPermisos
            .Include(ump => ump.Modulo)
                .ThenInclude(m => m.Area)
            .Include(ump => ump.Permiso)
            .Where(ump => ump.UsuarioId == usuarioId)
            .ToListAsync();

        return permisos
            .GroupBy(p => p.Modulo.Area.Nombre)
            .ToDictionary(
                areaGroup => areaGroup.Key,
                areaGroup => areaGroup
                    .GroupBy(p => p.Modulo.Id)
                    .ToDictionary(
                        moduloGroup => moduloGroup.Key,
                        moduloGroup => moduloGroup.Select(p => p.Permiso.Id).ToList()
                    )
            );
    }
}

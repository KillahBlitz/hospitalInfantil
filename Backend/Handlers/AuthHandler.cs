using Backend.Models.Repositories;
using Backend.Models.Request.UserAccess;
using Backend.Models.Response.UserAccess;

namespace Backend.Handlers;

public class AuthHandler
{
    private readonly UserAccessRepository _repository;

    public AuthHandler(UserAccessRepository repository)
    {
        _repository = repository;
    }

    public async Task<AuthResponse?> Authenticate(AuthRequest request)
    {
        var usuario = await _repository.GetUserAuth(request.User);

        if (usuario is null)
            return null;

        bool passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);

        if (!passwordValid)
            return null;

        var accesos = await _repository.GetAccess(usuario.Id);

        return new AuthResponse
        {
            Id = usuario.Id,
            Nombre = usuario.Nombre,
            Alias = usuario.Alias,
            Correo = usuario.Correo,
            Accesos = accesos
        };
    }

    public async Task<RegisterResponse?> Register(RegisterRequest request)
    {
        RegisterResponse response = new RegisterResponse
        {
            Success = false,
            Message = "El usuario ya existe o el correo ya está registrado"
        };
        var exist = await _repository.GetUserKeyAuth(request.user, request.email);
        if (exist)
        {
            return response;
        }
        else if (request.birthDate == null || request.birthDate == "")
        {
            response.Message = "La fecha de nacimiento es requerida";
            return response;
        }
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.password);
        var fechaNacimiento = DateOnly.ParseExact(request.birthDate, "yyyy-MM-dd");
        var newUserSolicitado = await _repository.CreateUserSolicitado(request, passwordHash, fechaNacimiento);
        if (newUserSolicitado == null)
        {
            response.Message = "Error al registrar el usuario";
            return response;
        }
        response.Success = true;
        response.Message = "Usuario registrado exitosamente";
        return response;
    }

    public async Task<AreasResponse?> GetAreas()
    {
        var areas = await _repository.GetAreas();
        var response = new AreasResponse();
        foreach (var area in areas)
        {
            response.Areas.Add(area.Nombre, area.Id);
        }
        return response;
    }

    public async Task<AccessResponse?> GetAccess()
    {
        var permisos = await _repository.GetPermisos();
        var response = new AccessResponse();
        foreach (var permiso in permisos)
        {
            response.Permisos.Add(permiso.Id, permiso.Nombre);
        }
        return response;
    }
}

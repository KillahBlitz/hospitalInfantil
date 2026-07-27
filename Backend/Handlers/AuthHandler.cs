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

    public string Register(RegisterRequest request)
    {
        //var usuario = await _repository.GetUserAuth(request.usuario);

        //if (usuario is not null)
        //    return null;

        //string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.password);
        return "Helloworld";
    }
}

using Backend.Models.Repositories;
//using Backend.Models.Request.Platform;
using Backend.Models.Response.Platform;

namespace Backend.Handlers;

public class PlatformHandler
{
    private readonly UserAccessRepository _repository;

    public PlatformHandler(UserAccessRepository repository)
    {
        _repository = repository;
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
                Aprobado = user.Aprobado
            };
            solicitudes.Add(solicitud);
        }
        return new UsersRequestResponse
        {
            Solicitudes = solicitudes
        };
    }
}

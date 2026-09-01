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

    public async Task<RequestActionResponse> ApproveRequest(ApproveRequestRequest request)
    {
        var solicitud = await _repository.GetRequestByIdAsync(request.RequestId);

        if (solicitud is null)
            return new RequestActionResponse { Success = false, Message = "La solicitud no existe o ya fue procesada." };

        await _repository.ApproveRequestAsync(solicitud, request.TypeId, request.Access);

        return new RequestActionResponse { Success = true, Message = "Solicitud aprobada. El usuario ya puede iniciar sesión." };
    }

    public async Task<RequestActionResponse> RejectRequest(RejectRequestRequest request)
    {
        var solicitud = await _repository.GetRequestByIdAsync(request.RequestId);

        if (solicitud is null)
            return new RequestActionResponse { Success = false, Message = "La solicitud no existe o ya fue procesada." };

        await _repository.RejectRequestAsync(solicitud);

        return new RequestActionResponse { Success = true, Message = "Solicitud rechazada." };
    }
}
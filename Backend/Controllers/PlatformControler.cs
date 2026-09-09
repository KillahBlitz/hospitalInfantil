using Microsoft.AspNetCore.Mvc;
using Backend.Handlers;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Backend.Models.Request.Platform;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PlatformController : ControllerBase
{
    private readonly PlatformHandler _platformHandler;
    private readonly ILogger<PlatformController> _logger;

    public PlatformController(PlatformHandler platformHandler, ILogger<PlatformController> logger)
    {
        _platformHandler = platformHandler;
        _logger = logger;
    }

    [HttpGet("Users")]
    public async Task<IActionResult> GetRegisteredUsers()
    {
        var response = await _platformHandler.GetRegisteredUsers();
        return Ok(response);
    }

    [HttpGet("UserRequest")]
    public async Task<IActionResult> GetUserRequest()
    {
        var response = await _platformHandler.GetAllUsers();

        if (response is null)
            return Unauthorized(new { message = "Credenciales inválidas" });
        return Ok(response);
    }

    [Authorize]
    [HttpPost("Users/{id:int}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "El usuario indicado no es válido." });
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId) || actorId <= 0)
            return Unauthorized(new { message = "Inicia sesión nuevamente para realizar la baja." });

        try
        {
            var response = await _platformHandler.DeactivateUser(id, actorId, cancellationToken);
            return response.Code switch
            {
                "success" => Ok(response),
                "not_found" => NotFound(response),
                "conflict" => Conflict(response),
                _ => StatusCode(StatusCodes.Status403Forbidden, response)
            };
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 or 547 })
        {
            return Conflict(new { message = "No se pudo completar la baja por un conflicto con registros relacionados. No se aplicaron cambios." });
        }
        catch (SqlException ex) when (ex.Number == 1205)
        {
            return Conflict(new { message = "Otra operación modificó estas cuentas. Intenta nuevamente." });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error al dar de baja al usuario {UserId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "No se pudo completar la baja. Consulta la lista antes de reintentar." });
        }
    }

    [Authorize]
    [HttpPut("UserRequest/{id:int}/comment")]
    public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentRequest request, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "El usuario indicado no es válido." });
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId) || actorId <= 0)
            return Unauthorized(new { message = "Inicia sesión nuevamente para actualizar el comentario." });

        try
        {
            var success = await _platformHandler.UpdateComment(id, request.Comentario, actorId, cancellationToken);
            if (!success) return NotFound(new { message = "La solicitud no fue encontrada." });
            return Ok(new { success = true, message = "Comentario actualizado correctamente." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error al actualizar comentario de {RequestId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "No se pudo actualizar el comentario." });
        }
    }

    [Authorize]
    [HttpPost("Users/Approve")]
    public async Task<IActionResult> ApproveUser([FromBody] ApproveUserRequest request, CancellationToken cancellationToken)
    {
        if (request.SolicitudId <= 0 || request.TipoId <= 0) 
            return BadRequest(new { message = "Datos de aprobación inválidos." });
            
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId) || actorId <= 0)
            return Unauthorized(new { message = "Inicia sesión nuevamente para aprobar usuarios." });

        try
        {
            var response = await _platformHandler.ApproveUserAsync(request, actorId, cancellationToken);
            return response.Code switch
            {
                "success" => Ok(response),
                "not_found" => NotFound(response),
                "conflict" => Conflict(response),
                _ => StatusCode(StatusCodes.Status403Forbidden, response)
            };
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 or 547 })
        {
            return Conflict(new { message = "No se pudo completar la aprobación por un conflicto con registros únicos. Revisa los datos de la cuenta." });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error al aprobar al usuario desde solicitud {RequestId}", request.SolicitudId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "No se pudo completar la aprobación." });
        }
    }
    [Authorize]
    [HttpGet("Users/{id:int}/Permissions")]
    public async Task<IActionResult> GetUserPermissions(int id)
    {
        if (id <= 0) return BadRequest(new { message = "ID de usuario inválido." });

        try
        {
            var response = await _platformHandler.GetUserPermissionsAsync(id);
            if (!response.Success) return NotFound(new { message = response.Message });
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener los permisos del usuario {UserId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error al obtener permisos." });
        }
    }

    [Authorize]
    [HttpPut("Users/Permissions")]
    public async Task<IActionResult> UpdateUserPermissions([FromBody] UpdateUserPermissionsRequest request, CancellationToken cancellationToken)
    {
        if (request.UserId <= 0 || request.TipoId <= 0) 
            return BadRequest(new { message = "Datos de actualización inválidos." });
            
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId) || actorId <= 0)
            return Unauthorized(new { message = "Inicia sesión nuevamente." });

        try
        {
            var response = await _platformHandler.UpdateUserPermissionsAsync(request, actorId, cancellationToken);
            return response.Code switch
            {
                "success" => Ok(response),
                "not_found" => NotFound(response),
                _ => StatusCode(StatusCodes.Status403Forbidden, response)
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error al actualizar permisos del usuario {UserId}", request.UserId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "No se pudo actualizar permisos." });
        }
    }
}


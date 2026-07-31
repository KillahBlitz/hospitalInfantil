using Microsoft.AspNetCore.Mvc;
using Backend.Handlers;
using Backend.Models.Request.UserAccess;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthHandler _authHandler;

    public AuthController(AuthHandler authHandler)
    {
        _authHandler = authHandler;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        var response = await _authHandler.Authenticate(request);

        if (response is null)
            return Unauthorized(new { message = "Credenciales inválidas" });
        return Ok(response);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authHandler.Register(request);

        if (response is null)
            return BadRequest(new { message = "Error al registrar el usuario" });
        return Ok(response);
    }

    [HttpPost("changePassword")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var result = await _authHandler.ChangePassword(request);

        return Ok(result);
    }

    [HttpGet("areas")]
    public async Task<IActionResult> Areas()
    {
        var response = await _authHandler.GetAreas();

        if (response is null)
            return BadRequest(new { message = "Error al obtener areas" });
        return Ok(response);
    }

    [HttpGet("access")]
    public async Task<IActionResult> Access()
    {
        var response = await _authHandler.GetAccess();

        if (response is null)
            return BadRequest(new { message = "Error al obtener permisos" });
        return Ok(response);
    }

    [HttpPost("modules")]
    public async Task<IActionResult> Modules([FromBody] ModuleRequest request)
    {
        var response = await _authHandler.GetModules(request);

        if (response is null)
            return BadRequest(new { message = "Error al obtener modulos" });
        return Ok(response);
    }
}

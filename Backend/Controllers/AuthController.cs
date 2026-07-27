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
        var usuario = await _authHandler.Authenticate(request);

        if (usuario is null)
            return Unauthorized(new { message = "Credenciales inválidas" });
        return Ok(usuario);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authHandler.Register(request);

        if (response is null)
            return BadRequest(new { message = "Error al registrar el usuario" });
        return Ok(response);
    }
}

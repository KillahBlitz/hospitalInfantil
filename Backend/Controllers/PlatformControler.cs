using Microsoft.AspNetCore.Mvc;
using Backend.Handlers;
//using Backend.Models.Request.Platform;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PlatformController : ControllerBase
{
    private readonly PlatformHandler _platformHandler;

    public PlatformController(PlatformHandler platformHandler)
    {
        _platformHandler = platformHandler;
    }

    [HttpGet("UserRequest")]
    public async Task<IActionResult> GetUserRequest()
    {
        var response = await _platformHandler.GetAllUsers();

        if (response is null)
            return Unauthorized(new { message = "Credenciales inválidas" });
        return Ok(response);
    }
}
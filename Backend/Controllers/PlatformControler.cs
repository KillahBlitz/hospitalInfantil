using Microsoft.AspNetCore.Mvc;
using Backend.Handlers;
using Backend.Models.Request.Platform;

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

    [HttpPost("ApproveRequest")]
    public async Task<IActionResult> ApproveRequest([FromBody] ApproveRequestRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _platformHandler.ApproveRequest(request);

        return response.Success ? Ok(response) : BadRequest(response);
    }

    [HttpPost("RejectRequest")]
    public async Task<IActionResult> RejectRequest([FromBody] RejectRequestRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _platformHandler.RejectRequest(request);

        return response.Success ? Ok(response) : BadRequest(response);
    }
}
using Microsoft.AspNetCore.Mvc;


namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public string login()
    {
        return "Hello from login endpoint";
    }
}

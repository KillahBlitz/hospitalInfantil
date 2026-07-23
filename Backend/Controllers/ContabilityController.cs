using Microsoft.AspNetCore.Mvc;


namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class ContabilityController : ControllerBase
{
    [HttpPost]
    public string Contability()
    {
        return "Hello from ContabilityController"; 
    }
}
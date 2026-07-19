using Microsoft.AspNetCore.Mvc;


namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class HumanResourcesController : ControllerBase
{
    [HttpPost]
    public string HumanResources()
    {
        return "Hello from HumanResourcesController"; 
    }
}
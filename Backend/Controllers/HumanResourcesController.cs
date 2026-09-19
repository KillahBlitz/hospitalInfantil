using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Backend.Handlers;
using Backend.Models.Request.HumanResources;
using Backend.Models.Response.HumanResources;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class HumanResourcesController : ControllerBase
{
    private readonly HumanResourcesHandler _humanResourcesHandler;
    private readonly ILogger<HumanResourcesController> _logger;

    public HumanResourcesController(
        HumanResourcesHandler humanResourcesHandler, ILogger<HumanResourcesController> logger)
    {
        _humanResourcesHandler = humanResourcesHandler;
        _logger = logger;
    }

    [HttpGet("Plazas")]
    public async Task<IActionResult> GetPlazas(
        [FromQuery] PlazaQueryRequest query, CancellationToken cancellationToken)
    {
        var response = await _humanResourcesHandler.GetPlazas(query, cancellationToken);
        return Ok(response);
    }

    [HttpPost("Plazas")]
    public async Task<IActionResult> CreatePlaza(
        [FromBody] PlazaRequest request, CancellationToken cancellationToken)
    {
        var response = await _humanResourcesHandler.CreatePlaza(request, cancellationToken);
        return response.Code == "success"
            ? StatusCode(StatusCodes.Status201Created, response)
            : TraducirOperacion(response);
    }

    [HttpPut("Plazas/{id:int}")]
    public async Task<IActionResult> UpdatePlaza(
        int id, [FromBody] PlazaRequest request, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "La plaza indicada no es valida." });
        var response = await _humanResourcesHandler.UpdatePlaza(id, request, cancellationToken);
        return TraducirOperacion(response);
    }

    [HttpDelete("Plazas/{id:int}")]
    public async Task<IActionResult> DeletePlaza(int id, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "La plaza indicada no es valida." });
        var response = await _humanResourcesHandler.DeletePlaza(id, cancellationToken);
        return TraducirOperacion(response);
    }

    [HttpGet("Unidades")]
    public async Task<IActionResult> GetUnidades(CancellationToken cancellationToken)
    {
        var response = await _humanResourcesHandler.GetUnidades(cancellationToken);
        return Ok(response);
    }

    [HttpGet("TiposContratacion")]
    public async Task<IActionResult> GetTiposContratacion(CancellationToken cancellationToken)
    {
        var response = await _humanResourcesHandler.GetTiposContratacion(cancellationToken);
        return Ok(response);
    }

    [HttpGet("Areas")]
    public async Task<IActionResult> GetAreas(CancellationToken cancellationToken)
    {
        var response = await _humanResourcesHandler.GetAreas(cancellationToken);
        return Ok(response);
    }

    [HttpPost("Areas")]
    public async Task<IActionResult> CreateArea(
        [FromBody] AreaRequest request, CancellationToken cancellationToken)
    {
        return await EjecutarCarga(
            () => _humanResourcesHandler.UploadAreas(new List<AreaRequest> { request }, cancellationToken),
            unaSola: true);
    }

    [HttpPost("Areas/Upload")]
    public async Task<IActionResult> UploadAreas(
        [FromBody] UploadAreasRequest request, CancellationToken cancellationToken)
    {
        return await EjecutarCarga(
            () => _humanResourcesHandler.UploadAreas(request.Areas, cancellationToken),
            unaSola: false);
    }

    [HttpPut("Areas/{id:int}")]
    public async Task<IActionResult> UpdateArea(
        int id, [FromBody] AreaRequest request, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "El area indicada no es valida." });
        var response = await _humanResourcesHandler.UpdateArea(id, request, cancellationToken);
        return TraducirOperacion(response);
    }

    [HttpDelete("Areas/{id:int}")]
    public async Task<IActionResult> DeleteArea(int id, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "El area indicada no es valida." });
        var response = await _humanResourcesHandler.DeleteArea(id, cancellationToken);
        return TraducirOperacion(response);
    }

    [HttpGet("Puestos")]
    public async Task<IActionResult> GetPuestos(CancellationToken cancellationToken)
    {
        var response = await _humanResourcesHandler.GetPuestos(cancellationToken);
        return Ok(response);
    }

    [HttpPost("Puestos")]
    public async Task<IActionResult> CreatePuesto(
        [FromBody] PuestoRequest request, CancellationToken cancellationToken)
    {
        return await EjecutarCarga(
            () => _humanResourcesHandler.UploadPuestos(new List<PuestoRequest> { request }, cancellationToken),
            unaSola: true);
    }

    [HttpPost("Puestos/Upload")]
    public async Task<IActionResult> UploadPuestos(
        [FromBody] UploadPuestosRequest request, CancellationToken cancellationToken)
    {
        return await EjecutarCarga(
            () => _humanResourcesHandler.UploadPuestos(request.Puestos, cancellationToken),
            unaSola: false);
    }

    [HttpPut("Puestos/{id:int}")]
    public async Task<IActionResult> UpdatePuesto(
        int id, [FromBody] PuestoRequest request, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "El puesto indicado no es valido." });
        var response = await _humanResourcesHandler.UpdatePuesto(id, request, cancellationToken);
        return TraducirOperacion(response);
    }

    [HttpDelete("Puestos/{id:int}")]
    public async Task<IActionResult> DeletePuesto(int id, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest(new { message = "El puesto indicado no es valido." });
        var response = await _humanResourcesHandler.DeletePuesto(id, cancellationToken);
        return TraducirOperacion(response);
    }

    private IActionResult TraducirOperacion(CatalogOperationResponse response) =>
        response.Code switch
        {
            "success" => Ok(response),
            "not_found" => NotFound(response),
            "conflict" => Conflict(response),
            _ => BadRequest(response)
        };

    private async Task<IActionResult> EjecutarCarga(
        Func<Task<CatalogUploadResponse>> carga, bool unaSola)
    {
        try
        {
            var response = await carga();

            if (!unaSola)
                return response.Code == "rejected" ? BadRequest(response) : Ok(response);

            if (response.Rechazadas > 0)
                return BadRequest(response);

            if (response.Omitidas > 0)
                return Conflict(response);

            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 or 547 })
        {
            _logger.LogWarning(ex, "Conflicto de integridad al cargar catalogo de recursos humanos.");
            return Conflict(new { message = "Alguno de los registros rompe una restriccion de la base de datos." });
        }
    }
}

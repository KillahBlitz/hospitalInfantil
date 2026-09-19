using Backend.Models.Repositories;
using Backend.Models.Request.HumanResources;
using Backend.Models.Response.HumanResources;
using Backend.Models.Schemas.HumanResources;

namespace Backend.Handlers;

public class HumanResourcesHandler
{
    private const int LargoMaximoClaveArea = 30;
    private const int LargoMaximoDescripcionArea = 150;
    private const int LargoMaximoCodigoPuesto = 20;
    private const int LargoMaximoDescripcionPuesto = 150;
    private const int LargoMaximoGradoSalarial = 10;

    private readonly HumanResourcesRepository _repository;

    public HumanResourcesHandler(HumanResourcesRepository repository)
    {
        _repository = repository;
    }

    public async Task<AreasResponse> GetAreas(CancellationToken cancellationToken = default)
    {
        var areas = await _repository.GetAreas(cancellationToken);

        return new AreasResponse
        {
            Areas = areas.Select(area => new AreaItem
            {
                Id = area.Id,
                ClaveArea = area.ClaveArea,
                Descripcion = area.Descripcion
            }).ToList()
        };
    }

    public async Task<PuestosResponse> GetPuestos(CancellationToken cancellationToken = default)
    {
        var puestos = await _repository.GetPuestos(cancellationToken);

        return new PuestosResponse
        {
            Puestos = puestos.Select(puesto => new PuestoItem
            {
                Id = puesto.Id,
                CodigoPuesto = puesto.CodigoPuesto,
                Descripcion = puesto.Descripcion,
                GradoSalarial = puesto.GradoSalarial,
                RangoSalarial = puesto.RangoSalarial
            }).ToList()
        };
    }

    public async Task<CatalogUploadResponse> UploadAreas(
        List<AreaRequest> solicitadas, CancellationToken cancellationToken = default)
    {
        var clavesExistentes = await _repository.GetClavesArea(cancellationToken);
        var descripcionesExistentes = await _repository.GetDescripcionesArea(cancellationToken);

        var nuevas = new List<Area>();
        var rechazos = new List<CatalogUploadRejection>();
        var omitidas = 0;

        for (var indice = 0; indice < solicitadas.Count; indice++)
        {
            var solicitada = solicitadas[indice];
            var clave = Homologar(solicitada.ClaveArea);
            var descripcion = Homologar(solicitada.Descripcion);
            var claveParaReporte = clave.Length > 0 ? clave : descripcion;

            if (descripcion.Length == 0)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = claveParaReporte,
                    Motivo = "La descripcion del area es obligatoria."
                });
                continue;
            }

            if (clave.Length > LargoMaximoClaveArea)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = claveParaReporte,
                    Motivo = $"La clave excede {LargoMaximoClaveArea} caracteres."
                });
                continue;
            }

            if (descripcion.Length > LargoMaximoDescripcionArea)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = claveParaReporte,
                    Motivo = $"La descripcion excede {LargoMaximoDescripcionArea} caracteres."
                });
                continue;
            }

            if (descripcionesExistentes.Contains(descripcion))
            {
                omitidas++;
                continue;
            }

            if (clave.Length > 0 && clavesExistentes.Contains(clave))
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = claveParaReporte,
                    Motivo = "Esa clave ya pertenece a otra area con descripcion distinta."
                });
                continue;
            }

            descripcionesExistentes.Add(descripcion);
            if (clave.Length > 0)
                clavesExistentes.Add(clave);

            nuevas.Add(new Area
            {
                ClaveArea = clave.Length > 0 ? clave : null,
                Descripcion = descripcion
            });
        }

        if (nuevas.Count > 0)
            await _repository.AddAreas(nuevas, cancellationToken);

        return ConstruirRespuesta("areas", solicitadas.Count, nuevas.Count, omitidas, rechazos);
    }

    public async Task<CatalogUploadResponse> UploadPuestos(
        List<PuestoRequest> solicitados, CancellationToken cancellationToken = default)
    {
        var codigosExistentes = await _repository.GetCodigosPuesto(cancellationToken);

        var nuevos = new List<Puesto>();
        var rechazos = new List<CatalogUploadRejection>();
        var omitidos = 0;

        for (var indice = 0; indice < solicitados.Count; indice++)
        {
            var solicitado = solicitados[indice];
            var codigo = Homologar(solicitado.CodigoPuesto);
            var descripcion = Homologar(solicitado.Descripcion);
            var gradoHomologado = Homologar(solicitado.GradoSalarial);
            var grado = gradoHomologado.Length > 0 ? gradoHomologado : null;

            if (codigo.Length == 0)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = descripcion,
                    Motivo = "El codigo de puesto es obligatorio."
                });
                continue;
            }

            if (descripcion.Length == 0)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = codigo,
                    Motivo = "La descripcion del puesto es obligatoria."
                });
                continue;
            }

            if (codigo.Length > LargoMaximoCodigoPuesto)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = codigo,
                    Motivo = $"El codigo excede {LargoMaximoCodigoPuesto} caracteres."
                });
                continue;
            }

            if (descripcion.Length > LargoMaximoDescripcionPuesto)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = codigo,
                    Motivo = $"La descripcion excede {LargoMaximoDescripcionPuesto} caracteres."
                });
                continue;
            }

            if (grado is not null && grado.Length > LargoMaximoGradoSalarial)
            {
                rechazos.Add(new CatalogUploadRejection
                {
                    Indice = indice,
                    Clave = codigo,
                    Motivo = $"El grado salarial excede {LargoMaximoGradoSalarial} caracteres."
                });
                continue;
            }

            if (codigosExistentes.Contains(codigo))
            {
                omitidos++;
                continue;
            }

            codigosExistentes.Add(codigo);

            nuevos.Add(new Puesto
            {
                CodigoPuesto = codigo,
                Descripcion = descripcion,
                GradoSalarial = grado,
                RangoSalarial = solicitado.RangoSalarial
            });
        }

        if (nuevos.Count > 0)
            await _repository.AddPuestos(nuevos, cancellationToken);

        return ConstruirRespuesta("puestos", solicitados.Count, nuevos.Count, omitidos, rechazos);
    }

    private static CatalogUploadResponse ConstruirRespuesta(
        string catalogo, int recibidas, int insertadas, int omitidas, List<CatalogUploadRejection> rechazos)
    {
        var code = rechazos.Count == 0
            ? "success"
            : insertadas > 0 ? "partial" : "rejected";

        return new CatalogUploadResponse
        {
            Code = code,
            Message = $"{catalogo}: {insertadas} insertadas, {omitidas} ya existian, {rechazos.Count} rechazadas.",
            Recibidas = recibidas,
            Insertadas = insertadas,
            Omitidas = omitidas,
            Rechazadas = rechazos.Count,
            Detalle = rechazos
        };
    }

    public async Task<CatalogOperationResponse> UpdateArea(
        int id, AreaRequest solicitada, CancellationToken cancellationToken = default)
    {
        var area = await _repository.FindArea(id, cancellationToken);
        if (area is null)
            return Resultado(false, "not_found", "El area indicada no existe.");

        var clave = Homologar(solicitada.ClaveArea);
        var descripcion = Homologar(solicitada.Descripcion);

        if (descripcion.Length == 0)
            return Resultado(false, "invalid", "La descripcion del area es obligatoria.");

        if (descripcion.Length > LargoMaximoDescripcionArea)
            return Resultado(false, "invalid", $"La descripcion excede {LargoMaximoDescripcionArea} caracteres.");

        if (clave.Length > LargoMaximoClaveArea)
            return Resultado(false, "invalid", $"La clave excede {LargoMaximoClaveArea} caracteres.");

        if (await _repository.ExisteOtraAreaConDescripcion(id, descripcion, cancellationToken))
            return Resultado(false, "conflict", "Ya existe otra area con esa descripcion.");

        if (clave.Length > 0 && await _repository.ExisteOtraAreaConClave(id, clave, cancellationToken))
            return Resultado(false, "conflict", "Ya existe otra area con esa clave.");

        area.Descripcion = descripcion;
        area.ClaveArea = clave.Length > 0 ? clave : null;
        await _repository.SaveChanges(cancellationToken);

        return Resultado(true, "success", "Area actualizada.");
    }

    public async Task<CatalogOperationResponse> DeleteArea(
        int id, CancellationToken cancellationToken = default)
    {
        var area = await _repository.FindArea(id, cancellationToken);
        if (area is null)
            return Resultado(false, "not_found", "El area indicada no existe.");

        var plazas = await _repository.ContarPlazasDeArea(id, cancellationToken);
        if (plazas > 0)
            return Resultado(false, "conflict",
                $"No se puede eliminar: {plazas} plaza(s) estan adscritas a esta area.");

        await _repository.DeleteArea(area, cancellationToken);
        return Resultado(true, "success", "Area eliminada.");
    }

    public async Task<CatalogOperationResponse> UpdatePuesto(
        int id, PuestoRequest solicitado, CancellationToken cancellationToken = default)
    {
        var puesto = await _repository.FindPuesto(id, cancellationToken);
        if (puesto is null)
            return Resultado(false, "not_found", "El puesto indicado no existe.");

        var codigo = Homologar(solicitado.CodigoPuesto);
        var descripcion = Homologar(solicitado.Descripcion);
        var gradoHomologado = Homologar(solicitado.GradoSalarial);

        if (codigo.Length == 0)
            return Resultado(false, "invalid", "El codigo de puesto es obligatorio.");

        if (descripcion.Length == 0)
            return Resultado(false, "invalid", "La descripcion del puesto es obligatoria.");

        if (codigo.Length > LargoMaximoCodigoPuesto)
            return Resultado(false, "invalid", $"El codigo excede {LargoMaximoCodigoPuesto} caracteres.");

        if (descripcion.Length > LargoMaximoDescripcionPuesto)
            return Resultado(false, "invalid", $"La descripcion excede {LargoMaximoDescripcionPuesto} caracteres.");

        if (gradoHomologado.Length > LargoMaximoGradoSalarial)
            return Resultado(false, "invalid", $"El grado salarial excede {LargoMaximoGradoSalarial} caracteres.");

        if (await _repository.ExisteOtroPuestoConCodigo(id, codigo, cancellationToken))
            return Resultado(false, "conflict", "Ya existe otro puesto con ese codigo.");

        puesto.CodigoPuesto = codigo;
        puesto.Descripcion = descripcion;
        puesto.GradoSalarial = gradoHomologado.Length > 0 ? gradoHomologado : null;
        puesto.RangoSalarial = solicitado.RangoSalarial;
        await _repository.SaveChanges(cancellationToken);

        return Resultado(true, "success", "Puesto actualizado.");
    }

    public async Task<CatalogOperationResponse> DeletePuesto(
        int id, CancellationToken cancellationToken = default)
    {
        var puesto = await _repository.FindPuesto(id, cancellationToken);
        if (puesto is null)
            return Resultado(false, "not_found", "El puesto indicado no existe.");

        var plazas = await _repository.ContarPlazasDePuesto(id, cancellationToken);
        if (plazas > 0)
            return Resultado(false, "conflict",
                $"No se puede eliminar: {plazas} plaza(s) usan este puesto.");

        await _repository.DeletePuesto(puesto, cancellationToken);
        return Resultado(true, "success", "Puesto eliminado.");
    }

    private static CatalogOperationResponse Resultado(bool success, string code, string message) =>
        new() { Success = success, Code = code, Message = message };

    private static string Homologar(string? valor) =>
        (valor ?? string.Empty).Trim().ToUpperInvariant();
}

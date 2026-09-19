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
    private const int TamanoPaginaPorDefecto = 10;

    private const int LargoMaximoClavePlaza = 10;
    private const int LargoMaximoDenominacion = 150;
    private const int LargoMaximoCodigoSHCP = 30;
    private const int LargoMaximoCodigoFederal = 30;
    private const int LargoMaximoClavePresupuestal = 60;

    private static readonly int[] TamanosPagina = [10, 50, 100];

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

    public async Task<TiposContratacionResponse> GetTiposContratacion(
        CancellationToken cancellationToken = default)
    {
        var tipos = await _repository.GetTiposContratacion(cancellationToken);

        return new TiposContratacionResponse
        {
            TiposContratacion = tipos.Select(tipo => new TipoContratacionItem
            {
                Id = tipo.Id,
                Descripcion = tipo.Descripcion
            }).ToList()
        };
    }

    public async Task<PlazasResponse> GetPlazas(
        PlazaQueryRequest filtros, CancellationToken cancellationToken = default)
    {
        var tamano = TamanosPagina.Contains(filtros.Tamano) ? filtros.Tamano : TamanoPaginaPorDefecto;
        var pagina = filtros.Pagina < 1 ? 1 : filtros.Pagina;

        var (total, plazas) = await _repository.GetPlazasPaginadas(filtros, pagina, tamano, cancellationToken);
        var totalPaginas = total == 0 ? 0 : (int)Math.Ceiling(total / (double)tamano);

        if (totalPaginas > 0 && pagina > totalPaginas)
        {
            pagina = totalPaginas;
            (total, plazas) = await _repository.GetPlazasPaginadas(filtros, pagina, tamano, cancellationToken);
        }

        return new PlazasResponse
        {
            Pagina = pagina,
            Tamano = tamano,
            Total = total,
            TotalPaginas = totalPaginas,
            Plazas = plazas.Select(plaza => new PlazaItem
            {
                Id = plaza.Id,
                ClavePlaza = plaza.ClavePlaza,
                CodigoPuesto = plaza.Puesto.CodigoPuesto,
                DescripcionPuesto = plaza.Puesto.Descripcion,
                GradoSalarial = plaza.Puesto.GradoSalarial,
                DenominacionPuesto = plaza.DenominacionPuesto,
                PuestoId = plaza.PuestoId,
                TipoContratacionId = plaza.TipoContratacionId,
                TipoPlazaId = plaza.TipoPlazaId,
                UnidadId = plaza.UnidadId,
                AreaId = plaza.AreaId,
                ClaveArea = plaza.Area?.ClaveArea,
                Area = plaza.Area?.Descripcion,
                TipoContratacion = plaza.TipoContratacion.Descripcion,
                TipoPlaza = plaza.TipoPlaza?.Descripcion,
                Unidad = plaza.Unidad.Nombre,
                Ocupabilidad = plaza.Ocupabilidad,
                FechaVacancia = plaza.FechaVacancia,
                CantidadPlazaHora = plaza.CantidadPlazaHora,
                CodigoSHCP = plaza.CodigoSHCP,
                CodigoFederalPuesto = plaza.CodigoFederalPuesto,
                ClavePresupuestalActual = plaza.ClavePresupuestalActual
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

    public async Task<UnidadesResponse> GetUnidades(CancellationToken cancellationToken = default)
    {
        var unidades = await _repository.GetUnidades(cancellationToken);

        return new UnidadesResponse
        {
            Unidades = unidades.Select(unidad => new UnidadItem
            {
                Id = unidad.Id,
                Unidad = unidad.Nombre,
                Ramo = unidad.Ramo,
                ZE = unidad.ZE
            }).ToList()
        };
    }

    public async Task<CatalogOperationResponse> CreatePlaza(
        PlazaRequest solicitada, CancellationToken cancellationToken = default)
    {
        var clave = Homologar(solicitada.ClavePlaza);
        var invalido = await ValidarPlaza(0, clave, solicitada, cancellationToken);
        if (invalido is not null) return invalido;

        var plaza = new Plaza
        {
            ClavePlaza = clave,
            PuestoId = solicitada.PuestoId!.Value,
            AreaId = solicitada.AreaId,
            TipoContratacionId = solicitada.TipoContratacionId!.Value,
            TipoPlazaId = solicitada.TipoPlazaId,
            UnidadId = solicitada.UnidadId!.Value,
            DenominacionPuesto = TextoOpcional(solicitada.DenominacionPuesto),
            CantidadPlazaHora = solicitada.CantidadPlazaHora,
            Ocupabilidad = solicitada.Ocupabilidad,
            FechaVacancia = solicitada.FechaVacancia,
            CodigoSHCP = TextoOpcional(solicitada.CodigoSHCP),
            CodigoFederalPuesto = TextoOpcional(solicitada.CodigoFederalPuesto),
            ClavePresupuestalActual = TextoOpcional(solicitada.ClavePresupuestalActual)
        };

        await _repository.AddPlaza(plaza, cancellationToken);
        return Resultado(true, "success", $"Plaza {clave} registrada.");
    }

    public async Task<CatalogOperationResponse> UpdatePlaza(
        int id, PlazaRequest solicitada, CancellationToken cancellationToken = default)
    {
        var plaza = await _repository.FindPlaza(id, cancellationToken);
        if (plaza is null)
            return Resultado(false, "not_found", "La plaza indicada no existe.");

        var clave = Homologar(solicitada.ClavePlaza);
        var invalido = await ValidarPlaza(id, clave, solicitada, cancellationToken);
        if (invalido is not null) return invalido;

        plaza.ClavePlaza = clave;
        plaza.PuestoId = solicitada.PuestoId!.Value;
        plaza.AreaId = solicitada.AreaId;
        plaza.TipoContratacionId = solicitada.TipoContratacionId!.Value;
        plaza.TipoPlazaId = solicitada.TipoPlazaId;
        plaza.UnidadId = solicitada.UnidadId!.Value;
        plaza.DenominacionPuesto = TextoOpcional(solicitada.DenominacionPuesto);
        plaza.CantidadPlazaHora = solicitada.CantidadPlazaHora;
        plaza.Ocupabilidad = solicitada.Ocupabilidad;
        plaza.FechaVacancia = solicitada.FechaVacancia;
        plaza.CodigoSHCP = TextoOpcional(solicitada.CodigoSHCP);
        plaza.CodigoFederalPuesto = TextoOpcional(solicitada.CodigoFederalPuesto);
        plaza.ClavePresupuestalActual = TextoOpcional(solicitada.ClavePresupuestalActual);

        await _repository.SaveChanges(cancellationToken);
        return Resultado(true, "success", $"Plaza {clave} actualizada.");
    }

    public async Task<CatalogOperationResponse> DeletePlaza(
        int id, CancellationToken cancellationToken = default)
    {
        var plaza = await _repository.FindPlaza(id, cancellationToken);
        if (plaza is null)
            return Resultado(false, "not_found", "La plaza indicada no existe.");

        var empleados = await _repository.ContarEmpleadosDePlaza(id, cancellationToken);
        if (empleados > 0)
            return Resultado(false, "conflict",
                $"No se puede eliminar: {empleados} empleado(s) estan asignados a esta plaza.");

        var registros = await _repository.ContarRegistrosCodFedDePlaza(id, cancellationToken);
        if (registros > 0)
            return Resultado(false, "conflict",
                $"No se puede eliminar: la plaza tiene {registros} registro(s) de codigo federal.");

        await _repository.DeletePlaza(plaza, cancellationToken);
        return Resultado(true, "success", $"Plaza {plaza.ClavePlaza} eliminada.");
    }

    private async Task<CatalogOperationResponse?> ValidarPlaza(
        int id, string clave, PlazaRequest solicitada, CancellationToken cancellationToken)
    {
        if (clave.Length == 0)
            return Resultado(false, "invalid", "La clave de plaza es obligatoria.");

        if (clave.Length > LargoMaximoClavePlaza)
            return Resultado(false, "invalid", $"La clave de plaza excede {LargoMaximoClavePlaza} caracteres.");

        if (!solicitada.PuestoId.HasValue)
            return Resultado(false, "invalid", "El puesto es obligatorio.");

        if (!solicitada.TipoContratacionId.HasValue)
            return Resultado(false, "invalid", "El tipo de contratacion es obligatorio.");

        if (!solicitada.UnidadId.HasValue)
            return Resultado(false, "invalid", "La unidad es obligatoria.");

        var denominacion = Homologar(solicitada.DenominacionPuesto);
        if (denominacion.Length > LargoMaximoDenominacion)
            return Resultado(false, "invalid", $"La denominacion excede {LargoMaximoDenominacion} caracteres.");

        if (Homologar(solicitada.CodigoSHCP).Length > LargoMaximoCodigoSHCP)
            return Resultado(false, "invalid", $"El codigo SHCP excede {LargoMaximoCodigoSHCP} caracteres.");

        if (Homologar(solicitada.CodigoFederalPuesto).Length > LargoMaximoCodigoFederal)
            return Resultado(false, "invalid", $"El codigo federal excede {LargoMaximoCodigoFederal} caracteres.");

        if (Homologar(solicitada.ClavePresupuestalActual).Length > LargoMaximoClavePresupuestal)
            return Resultado(false, "invalid",
                $"La clave presupuestal excede {LargoMaximoClavePresupuestal} caracteres.");

        if (solicitada.CantidadPlazaHora.HasValue && solicitada.CantidadPlazaHora.Value < 0)
            return Resultado(false, "invalid", "La cantidad de plaza u hora no puede ser negativa.");

        if (!await _repository.ExistePuesto(solicitada.PuestoId.Value, cancellationToken))
            return Resultado(false, "invalid", "El puesto indicado no existe.");

        if (!await _repository.ExisteTipoContratacion(solicitada.TipoContratacionId.Value, cancellationToken))
            return Resultado(false, "invalid", "El tipo de contratacion indicado no existe.");

        if (!await _repository.ExisteUnidad(solicitada.UnidadId.Value, cancellationToken))
            return Resultado(false, "invalid", "La unidad indicada no existe.");

        if (solicitada.AreaId.HasValue &&
            !await _repository.ExisteArea(solicitada.AreaId.Value, cancellationToken))
            return Resultado(false, "invalid", "El area indicada no existe.");

        if (solicitada.TipoPlazaId.HasValue &&
            !await _repository.ExisteTipoPlaza(solicitada.TipoPlazaId.Value, cancellationToken))
            return Resultado(false, "invalid", "El tipo de plaza indicado no existe.");

        if (await _repository.ExisteOtraPlazaConClave(id, clave, cancellationToken))
            return Resultado(false, "conflict", "Ya existe otra plaza con esa clave.");

        return null;
    }

    private static string? TextoOpcional(string? valor)
    {
        var limpio = Homologar(valor);
        return limpio.Length > 0 ? limpio : null;
    }

    private static CatalogOperationResponse Resultado(bool success, string code, string message) =>
        new() { Success = success, Code = code, Message = message };

    private static string Homologar(string? valor) =>
        (valor ?? string.Empty).Trim().ToUpperInvariant();
}

using Backend.Data;
using Backend.Models.Request.HumanResources;
using Backend.Models.Schemas.HumanResources;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models.Repositories;

public class HumanResourcesRepository
{
    private readonly HumanResourcesDbContext _context;

    public HumanResourcesRepository(HumanResourcesDbContext context)
    {
        _context = context;
    }

    public async Task<List<Area>> GetAreas(CancellationToken cancellationToken = default)
    {
        return await _context.Areas
            .AsNoTracking()
            .OrderBy(a => a.ClaveArea)
            .ToListAsync(cancellationToken);
    }

    public async Task<HashSet<string>> GetClavesArea(CancellationToken cancellationToken = default)
    {
        var claves = await _context.Areas
            .AsNoTracking()
            .Where(a => a.ClaveArea != null)
            .Select(a => a.ClaveArea!)
            .ToListAsync(cancellationToken);

        return new HashSet<string>(claves, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<HashSet<string>> GetDescripcionesArea(CancellationToken cancellationToken = default)
    {
        var descripciones = await _context.Areas
            .AsNoTracking()
            .Select(a => a.Descripcion)
            .ToListAsync(cancellationToken);

        return new HashSet<string>(descripciones, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<List<Area>> AddAreas(List<Area> areas, CancellationToken cancellationToken = default)
    {
        await _context.Areas.AddRangeAsync(areas, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return areas;
    }

    public async Task<Area?> FindArea(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Areas.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<bool> ExisteOtraAreaConDescripcion(
        int id, string descripcion, CancellationToken cancellationToken = default)
    {
        return await _context.Areas
            .AsNoTracking()
            .AnyAsync(a => a.Id != id && a.Descripcion == descripcion, cancellationToken);
    }

    public async Task<bool> ExisteOtraAreaConClave(
        int id, string clave, CancellationToken cancellationToken = default)
    {
        return await _context.Areas
            .AsNoTracking()
            .AnyAsync(a => a.Id != id && a.ClaveArea == clave, cancellationToken);
    }

    public async Task<int> ContarPlazasDeArea(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Plazas
            .AsNoTracking()
            .CountAsync(p => p.AreaId == id, cancellationToken);
    }

    public async Task DeleteArea(Area area, CancellationToken cancellationToken = default)
    {
        _context.Areas.Remove(area);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Puesto>> GetPuestos(CancellationToken cancellationToken = default)
    {
        return await _context.Puestos
            .AsNoTracking()
            .OrderBy(p => p.CodigoPuesto)
            .ToListAsync(cancellationToken);
    }

    public async Task<HashSet<string>> GetCodigosPuesto(CancellationToken cancellationToken = default)
    {
        var codigos = await _context.Puestos
            .AsNoTracking()
            .Select(p => p.CodigoPuesto)
            .ToListAsync(cancellationToken);

        return new HashSet<string>(codigos, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<List<Puesto>> AddPuestos(List<Puesto> puestos, CancellationToken cancellationToken = default)
    {
        await _context.Puestos.AddRangeAsync(puestos, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return puestos;
    }

    public async Task<Puesto?> FindPuesto(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Puestos.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> ExisteOtroPuestoConCodigo(
        int id, string codigo, CancellationToken cancellationToken = default)
    {
        return await _context.Puestos
            .AsNoTracking()
            .AnyAsync(p => p.Id != id && p.CodigoPuesto == codigo, cancellationToken);
    }

    public async Task<int> ContarPlazasDePuesto(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Plazas
            .AsNoTracking()
            .CountAsync(p => p.PuestoId == id, cancellationToken);
    }

    public async Task DeletePuesto(Puesto puesto, CancellationToken cancellationToken = default)
    {
        _context.Puestos.Remove(puesto);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<TipoContratacion>> GetTiposContratacion(CancellationToken cancellationToken = default)
    {
        return await _context.TiposContratacion
            .AsNoTracking()
            .OrderBy(t => t.Descripcion)
            .ToListAsync(cancellationToken);
    }

    public async Task<(int Total, List<Plaza> Plazas)> GetPlazasPaginadas(
        PlazaQueryRequest filtros, int pagina, int tamano, CancellationToken cancellationToken = default)
    {
        var consulta = _context.Plazas.AsNoTracking();

        if (filtros.AreaId.HasValue)
            consulta = consulta.Where(p => p.AreaId == filtros.AreaId.Value);

        if (filtros.PuestoId.HasValue)
            consulta = consulta.Where(p => p.PuestoId == filtros.PuestoId.Value);

        if (filtros.TipoContratacionId.HasValue)
            consulta = consulta.Where(p => p.TipoContratacionId == filtros.TipoContratacionId.Value);

        if (filtros.Ocupabilidad.HasValue)
            consulta = consulta.Where(p => p.Ocupabilidad == filtros.Ocupabilidad.Value);

        if (filtros.FechaVacancia.HasValue)
            consulta = consulta.Where(p => p.FechaVacancia == filtros.FechaVacancia.Value);

        var texto = (filtros.Texto ?? string.Empty).Trim();
        if (texto.Length > 0)
        {
            consulta = consulta.Where(p =>
                p.ClavePlaza.Contains(texto) ||
                p.Puesto.CodigoPuesto.Contains(texto) ||
                p.Puesto.Descripcion.Contains(texto) ||
                (p.DenominacionPuesto != null && p.DenominacionPuesto.Contains(texto)) ||
                (p.Area != null && p.Area.Descripcion.Contains(texto)) ||
                (p.CodigoFederalPuesto != null && p.CodigoFederalPuesto.Contains(texto)) ||
                (p.ClavePresupuestalActual != null && p.ClavePresupuestalActual.Contains(texto)));
        }

        var total = await consulta.CountAsync(cancellationToken);

        var plazas = await consulta
            .Include(p => p.Puesto)
            .Include(p => p.Area)
            .Include(p => p.TipoContratacion)
            .Include(p => p.TipoPlaza)
            .Include(p => p.Unidad)
            .OrderBy(p => p.ClavePlaza.Length)
            .ThenBy(p => p.ClavePlaza)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .ToListAsync(cancellationToken);

        return (total, plazas);
    }

    public async Task<List<Unidad>> GetUnidades(CancellationToken cancellationToken = default)
    {
        return await _context.Unidades
            .AsNoTracking()
            .OrderBy(u => u.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<Plaza?> FindPlaza(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Plazas.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> ExisteOtraPlazaConClave(
        int id, string clave, CancellationToken cancellationToken = default)
    {
        return await _context.Plazas
            .AsNoTracking()
            .AnyAsync(p => p.Id != id && p.ClavePlaza == clave, cancellationToken);
    }

    public async Task<bool> ExistePuesto(int id, CancellationToken cancellationToken = default) =>
        await _context.Puestos.AsNoTracking().AnyAsync(p => p.Id == id, cancellationToken);

    public async Task<bool> ExisteArea(int id, CancellationToken cancellationToken = default) =>
        await _context.Areas.AsNoTracking().AnyAsync(a => a.Id == id, cancellationToken);

    public async Task<bool> ExisteTipoContratacion(int id, CancellationToken cancellationToken = default) =>
        await _context.TiposContratacion.AsNoTracking().AnyAsync(t => t.Id == id, cancellationToken);

    public async Task<bool> ExisteTipoPlaza(int id, CancellationToken cancellationToken = default) =>
        await _context.TiposPlaza.AsNoTracking().AnyAsync(t => t.Id == id, cancellationToken);

    public async Task<bool> ExisteUnidad(int id, CancellationToken cancellationToken = default) =>
        await _context.Unidades.AsNoTracking().AnyAsync(u => u.Id == id, cancellationToken);

    public async Task<Plaza> AddPlaza(Plaza plaza, CancellationToken cancellationToken = default)
    {
        await _context.Plazas.AddAsync(plaza, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return plaza;
    }

    public async Task<int> ContarEmpleadosDePlaza(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Empleados
            .AsNoTracking()
            .CountAsync(e => e.PlazaId == id, cancellationToken);
    }

    public async Task<int> ContarRegistrosCodFedDePlaza(int id, CancellationToken cancellationToken = default)
    {
        return await _context.RegistroCodFedPuestos
            .AsNoTracking()
            .CountAsync(r => r.PlazaId == id, cancellationToken);
    }

    public async Task DeletePlaza(Plaza plaza, CancellationToken cancellationToken = default)
    {
        _context.Plazas.Remove(plaza);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChanges(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

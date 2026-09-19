using Backend.Data;
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

    public async Task SaveChanges(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

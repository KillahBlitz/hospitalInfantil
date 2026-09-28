using System;
using System.Collections.Generic;

namespace Backend.Models.Response.HumanResources;

public class EmpleadoItem
{
    public int Id { get; set; }

    public int? PlazaId { get; set; }

    public string? ClavePlaza { get; set; }

    public string? DenominacionPuesto { get; set; }

    public string Nombres { get; set; } = null!;

    public string ApellidoPaterno { get; set; } = null!;

    public string? ApellidoMaterno { get; set; }

    public string NombreCompleto { get; set; } = null!;

    public DateOnly FechaNacimiento { get; set; }

    public string Sexo { get; set; } = null!;

    public string CURP { get; set; } = null!;

    public string RFC { get; set; } = null!;

    public string? NSS { get; set; }

    public DateOnly FechaIngreso { get; set; }

    public bool Activo { get; set; }
}

public class EmpleadosResponse
{
    public int Pagina { get; set; }

    public int Tamano { get; set; }

    public int Total { get; set; }

    public int TotalPaginas { get; set; }

    public List<EmpleadoItem> Empleados { get; set; } = new();
}

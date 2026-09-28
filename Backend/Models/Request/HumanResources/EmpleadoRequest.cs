using System;

namespace Backend.Models.Request.HumanResources;

public class EmpleadoRequest
{
    public int? PlazaId { get; set; }

    public string Nombres { get; set; } = null!;

    public string ApellidoPaterno { get; set; } = null!;

    public string? ApellidoMaterno { get; set; }

    public DateOnly FechaNacimiento { get; set; }

    public string Sexo { get; set; } = null!;

    public string CURP { get; set; } = null!;

    public string RFC { get; set; } = null!;

    public string? NSS { get; set; }

    public DateOnly FechaIngreso { get; set; }

    public bool Activo { get; set; }
}

using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Empleado
{
    public int Id { get; set; }

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

    public virtual Plaza? Plaza { get; set; }

    public virtual ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();

    public virtual ICollection<Nomina> Nominas { get; set; } = new List<Nomina>();
}

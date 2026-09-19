using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Nomina
{
    public int Id { get; set; }

    public int EmpleadoId { get; set; }

    public int TipoNominaId { get; set; }

    public int RegimenSSId { get; set; }

    public short NumeroQuincena { get; set; }

    public DateOnly FechaInicial { get; set; }

    public DateOnly FechaFinal { get; set; }

    public DateOnly? FechaPago { get; set; }

    public decimal Percepciones { get; set; }

    public decimal Deducciones { get; set; }

    public decimal Neto { get; set; }

    public virtual Empleado Empleado { get; set; } = null!;

    public virtual TipoNomina TipoNomina { get; set; } = null!;

    public virtual RegimenSS RegimenSS { get; set; } = null!;
}

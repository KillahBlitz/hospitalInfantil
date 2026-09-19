using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.HumanResources;

public partial class Plaza
{
    public int Id { get; set; }

    public string ClavePlaza { get; set; } = null!;

    public int PuestoId { get; set; }

    public int? AreaId { get; set; }

    public int TipoContratacionId { get; set; }

    public int? TipoPlazaId { get; set; }

    public int UnidadId { get; set; }

    public string? DenominacionPuesto { get; set; }

    public short? CantidadPlazaHora { get; set; }

    public bool Ocupabilidad { get; set; }

    public DateOnly? FechaVacancia { get; set; }

    public string? CodigoSHCP { get; set; }

    public string? CodigoFederalPuesto { get; set; }

    public string? ClavePresupuestalActual { get; set; }

    public virtual Puesto Puesto { get; set; } = null!;

    public virtual Area? Area { get; set; }

    public virtual TipoContratacion TipoContratacion { get; set; } = null!;

    public virtual TipoPlaza? TipoPlaza { get; set; }

    public virtual Unidad Unidad { get; set; } = null!;

    public virtual ICollection<Empleado> Empleados { get; set; } = new List<Empleado>();

    public virtual ICollection<RegistroCodFedPuesto> RegistroCodFedPuestos { get; set; } = new List<RegistroCodFedPuesto>();
}

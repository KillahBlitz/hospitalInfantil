using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class MovimientoContable
{
    public int IdMovimientoCont { get; set; }

    public int? IdProveedor { get; set; }

    public int? IdNumeroContrato { get; set; }

    public int? IdPoliza { get; set; }

    public DateOnly FechaInicio { get; set; }

    public DateOnly? FechaFinal { get; set; }

    public int NumeroEntrada { get; set; }

    public int? IdTipoMovCon { get; set; }

    public int? AñoPeriodo { get; set; }

    public string? DescripcionOriginal { get; set; }

    public decimal? SaldoInicial { get; set; }

    public decimal? SaldoFinal { get; set; }

    public decimal? SumaMovimientos { get; set; }

    public int? IdMovimientoMonetario { get; set; }

    public virtual Proveedor? Proveedor { get; set; }

    public virtual Contrato? Contrato { get; set; }

    public virtual PolizaContable? Poliza { get; set; }

    public virtual TipoMovimientosCon? TipoMovCon { get; set; }

    public virtual MovimientoMonetario? MovimientoMonetario { get; set; }
}
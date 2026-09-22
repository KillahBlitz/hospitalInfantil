using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class ComplementoPago
{
    public int IdComplementoPago { get; set; }

    public string FolioFiscal { get; set; } = null!;

    public int? IdProveedor { get; set; }

    public DateOnly FechaEmision { get; set; }

    public DateOnly? FechaCertificacion { get; set; }

    public int? IdMetodoPago { get; set; }

    public decimal? MontoTotal { get; set; }
}
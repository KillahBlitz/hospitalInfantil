using System;
using System.Collections.Generic;

namespace Backend.Models.Schemas.Contability;

public partial class Factura
{
    public int IdFactura {get; set;}

    public int? Serie {get; set;}

    public string? FolioFiscal {get; set;}

    public int? IdProveedor {get; set;}

    public decimal? ImporteFactura {get; set;}

    public string? Estatus {get; set;}

    public int? IdNumeroContrato {get; set;}

}
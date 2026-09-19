namespace Backend.Models.Response.HumanResources;

public class CatalogUploadResponse
{
    public string Code { get; set; } = null!;
    public string Message { get; set; } = null!;
    public int Recibidas { get; set; }
    public int Insertadas { get; set; }
    public int Omitidas { get; set; }
    public int Rechazadas { get; set; }
    public List<CatalogUploadRejection> Detalle { get; set; } = new();
}

public class CatalogUploadRejection
{
    public int Indice { get; set; }
    public string Clave { get; set; } = null!;
    public string Motivo { get; set; } = null!;
}

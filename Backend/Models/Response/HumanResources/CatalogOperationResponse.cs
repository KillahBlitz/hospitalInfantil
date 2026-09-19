namespace Backend.Models.Response.HumanResources;

public class CatalogOperationResponse
{
    public bool Success { get; set; }
    public string Code { get; set; } = null!;
    public string Message { get; set; } = null!;
}

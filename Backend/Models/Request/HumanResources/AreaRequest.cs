using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.HumanResources;

public class AreaRequest
{
    public string? ClaveArea { get; set; }

    public string? Descripcion { get; set; }
}

public class UploadAreasRequest
{
    [Required]
    [MinLength(1)]
    public List<AreaRequest> Areas { get; set; } = new();
}

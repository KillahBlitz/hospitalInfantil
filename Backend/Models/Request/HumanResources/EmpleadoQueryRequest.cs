namespace Backend.Models.Request.HumanResources;

public class EmpleadoQueryRequest
{
    public int Pagina { get; set; } = 1;

    public int Tamano { get; set; } = 10;

    public string? Texto { get; set; }

    public string? Sexo { get; set; }

    public bool? Activo { get; set; }
}

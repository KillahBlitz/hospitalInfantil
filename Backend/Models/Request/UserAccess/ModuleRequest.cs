using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.UserAccess;

public class ModuleRequest
{
    [Required]
    public List<int> areasId { get; set; } = new List<int>();
}
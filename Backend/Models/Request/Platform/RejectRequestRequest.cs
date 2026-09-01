using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Request.Platform;

public class RejectRequestRequest
{
    [Required]
    public int RequestId { get; set; }
}
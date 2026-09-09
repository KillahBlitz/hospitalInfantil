namespace Backend.Models.Response.Platform;

public class DeactivateUserResponse
{
    public bool Success { get; set; }
    public string Code { get; set; } = null!;
    public string Message { get; set; } = null!;
}

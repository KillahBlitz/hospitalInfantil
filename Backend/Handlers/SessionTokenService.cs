using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.Extensions.Options;

namespace Backend.Handlers;

public class SessionTokenService(IOptionsMonitor<BearerTokenOptions> options)
{
    public string Create(int userId)
    {
        var configuration = options.Get(BearerTokenDefaults.AuthenticationScheme);
        var identity = new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString(CultureInfo.InvariantCulture)) },
            BearerTokenDefaults.AuthenticationScheme);
        var properties = new AuthenticationProperties
        {
            IssuedUtc = DateTimeOffset.UtcNow,
            ExpiresUtc = DateTimeOffset.UtcNow.Add(configuration.BearerTokenExpiration)
        };
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), properties,
            BearerTokenDefaults.AuthenticationScheme);

        return configuration.BearerTokenProtector.Protect(ticket);
    }
}

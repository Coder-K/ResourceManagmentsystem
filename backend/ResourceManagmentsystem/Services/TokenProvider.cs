using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ResourceManagmentsystem.Models;

namespace ResourceManagmentsystem.Services
{
    /// <summary>Builds signed JWTs. Claims: sub (user id), jti (session id), name, email, role, AccessLevel.</summary>
    public sealed class TokenProvider
    {
        private readonly JwtSettings _settings;

        public TokenProvider(IOptions<JwtSettings> options)
        {
            _settings = options.Value;
        }

        public string GenerateToken(User user, string sessionId, DateTime expiresUtc)
        {
            var now = DateTime.UtcNow;
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("sub", user.Id.ToString()),
                    new Claim("jti", sessionId),
                    new Claim("name", $"{user.Name} {user.Surname}"),
                    new Claim("email", user.Email),
                    new Claim("role", user.AccessLevel.ToString()),
                    new Claim("AccessLevel", ((int)user.AccessLevel).ToString())
                }),
                Issuer = _settings.Issuer,
                Audience = _settings.Audience,
                IssuedAt = now,
                NotBefore = now,
                Expires = expiresUtc,
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            };
            return new JsonWebTokenHandler().CreateToken(tokenDescriptor);
        }
    }
}

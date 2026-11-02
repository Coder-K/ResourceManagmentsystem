using System.Security.Claims;
using ResourceManagmentsystem.Models;

namespace ResourceManagmentsystem.Services
{
    public static class ClaimsExtensions
    {
        public static int GetUserId(this ClaimsPrincipal p) => int.Parse(p.FindFirstValue("sub")!);
        public static string GetSessionId(this ClaimsPrincipal p) => p.FindFirstValue("jti")!;
        public static AccessLevel GetAccessLevel(this ClaimsPrincipal p) => Enum.Parse<AccessLevel>(p.FindFirstValue("role")!);
    }
}

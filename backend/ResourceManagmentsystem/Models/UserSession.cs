using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    /// <summary>
    /// One row per login. The JWT's "jti" claim points at this row, which is how the API
    /// enforces the 1-hour idle timeout and can revoke a token on logout.
    /// </summary>
    public class UserSession
    {
        [Key, MaxLength(36)] public string Id { get; set; } = Guid.NewGuid().ToString();
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        public DateTime LastActivityUtc { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresUtc { get; set; }            // absolute cap (same as the JWT "exp")
        public DateTime? RevokedUtc { get; set; }
    }
}

using Microsoft.AspNetCore.Identity;
using ResourceManagmentsystem.Models;

namespace ResourceManagmentsystem.Services
{
    /// <summary>
    /// Wraps the same ASP.NET Identity hasher the original project used, so every password already
    /// stored in app.db keeps working. Also holds the password rules.
    /// </summary>
    public class PasswordService
    {
        private readonly PasswordHasher<User> _hasher = new();
        private readonly string _dummyHash;
        private readonly User _dummyUser = new();

        public PasswordService()
        {
            _dummyHash = _hasher.HashPassword(_dummyUser, "Not-a-real-password-1!");
        }

        public string Hash(User user, string password) => _hasher.HashPassword(user, password);

        public PasswordVerificationResult Verify(User user, string password) =>
            _hasher.VerifyHashedPassword(user, user.PasswordHash, password);

        /// <summary>Spend the same time as a real check when the email is unknown (stops timing-based user discovery).</summary>
        public void BurnTime(string password) => _hasher.VerifyHashedPassword(_dummyUser, _dummyHash, password);

        /// <summary>Returns an error message, or null when the password is acceptable.</summary>
        public static string? Validate(string? pw, string? email = null)
        {
            if (string.IsNullOrEmpty(pw) || pw.Length < 10) return "Password must be at least 10 characters long.";
            if (pw.Length > 128) return "Password must be at most 128 characters long.";
            if (!pw.Any(char.IsUpper)) return "Password must contain an uppercase letter.";
            if (!pw.Any(char.IsLower)) return "Password must contain a lowercase letter.";
            if (!pw.Any(char.IsDigit)) return "Password must contain a digit.";
            if (pw.All(char.IsLetterOrDigit)) return "Password must contain a special character.";
            var local = email?.Split('@')[0];
            if (local is { Length: >= 3 } && pw.Contains(local, StringComparison.OrdinalIgnoreCase))
                return "Password must not contain your email name.";
            return null;
        }
    }
}

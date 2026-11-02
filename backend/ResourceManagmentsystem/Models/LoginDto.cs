using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    public class LoginDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public record LoginResponseDto(string Token, DateTime Expire, int idleTime, UserDto User);
}

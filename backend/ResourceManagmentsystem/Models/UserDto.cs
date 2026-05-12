using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    public class UserDto
    {

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Surname { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Invalid contact number format.")]
        public string Contact { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        public int AccessLevel { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    public class User
    {
        //basic user variables 
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Surname { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\+?[1-9]\d{1,14}$", ErrorMessage = "Invalid contact number .")]
        public string Contact { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public AccessLevel AccessLevel { get; set; }

        // login security 
        public bool IsActive { get; set; } = true;
        public int FailedLoginCount { get; set; }
        public DateTime? LockoutEndUtc { get; set; }
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        public List<ProjectAssignment> Assignments { get; set; } = new();
    }
}

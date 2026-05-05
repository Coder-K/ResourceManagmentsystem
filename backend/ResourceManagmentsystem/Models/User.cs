namespace ResourceManagmentsystem.Models
{
    public class User
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Contact { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public int AccessLevel { get; set; }
    }
}

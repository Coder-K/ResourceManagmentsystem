using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    /// <summary>Shared validation rules.</summary>
    public static class Rules
    {
        // 10 to 15 digits, optional leading + (accepts 0821234567 and +27821234567)
        public const string Phone = @"^\+?\d{10,15}$";
    }

    /// <summary>What the API sends back about a user. Never contains the password or its hash.</summary>
    public record UserDto(int Id, string Name, string Surname, string Email, string Contact,
                          AccessLevel AccessLevel, bool IsActive, DateTime CreatedUtc);

    public record CreateUserDto(
        [Required, StringLength(100, MinimumLength = 1)] string Name,
        [Required, StringLength(100, MinimumLength = 1)] string Surname,
        [Required, EmailAddress, MaxLength(254)] string Email,
        [Required, RegularExpression(Rules.Phone, ErrorMessage = "Invalid contact number format.")] string Contact,
        [Required, MaxLength(128)] string Password,
        [EnumDataType(typeof(AccessLevel))] AccessLevel? AccessLevel);

    public record UpdateUserDto(
        [Required, StringLength(100, MinimumLength = 1)] string Name,
        [Required, StringLength(100, MinimumLength = 1)] string Surname,
        [Required, EmailAddress, MaxLength(254)] string Email,
        [Required, RegularExpression(Rules.Phone, ErrorMessage = "Invalid contact number format.")] string Contact,
        [EnumDataType(typeof(AccessLevel))] AccessLevel? AccessLevel,
        bool? IsActive,
        [MaxLength(128)] string? NewPassword);

    public record ChangePasswordDto(
        [Required, MaxLength(128)] string CurrentPassword,
        [Required, MaxLength(128)] string NewPassword);

    public static class Mapping
    {
        public static UserDto ToDto(User u) =>
            new(u.Id, u.Name, u.Surname, u.Email, u.Contact, u.AccessLevel, u.IsActive, u.CreatedUtc);
    }
}

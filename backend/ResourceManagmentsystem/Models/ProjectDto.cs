using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    public record MemberDto(int Id, string FullName);
    public record TempAccessDto(int UserId, string FullName, DateTime ExpiresUtc);

    public record ProjectDto(
        int Id, string Name, string? Description, ProjectStatus Status, int ProgressPercent, bool IsPriority,
        DateTime? DueDate, DateTime UpdatedUtc,
        bool CanEdit, string AccessType, DateTime? AccessExpiresUtc,
        List<MemberDto> Members, List<TempAccessDto> TemporaryAccess);

    public record CreateProjectDto(
        [Required, StringLength(150, MinimumLength = 2)] string Name,
        [MaxLength(2000)] string? Description,
        DateTime? DueDate,
        List<int>? MemberIds);

    public record UpdateProjectDto(
        [StringLength(150, MinimumLength = 2)] string? Name,
        [MaxLength(2000)] string? Description,
        ProjectStatus? Status,
        [Range(0, 100)] int? ProgressPercent,
        DateTime? DueDate);

    public record SetPriorityDto(bool IsPriority);
    public record SetMembersDto([Required] List<int> UserIds);
    public record GrantAccessDto(int UserId);

    public record DashboardDto(
        int TotalProjects, int RunningProjects, int CompletedProjects, int OverdueProjects, int AverageProgress,
        Dictionary<string, int> StatusBreakdown, List<ProjectDto> Projects);
}

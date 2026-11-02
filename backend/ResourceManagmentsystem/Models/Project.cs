using System.ComponentModel.DataAnnotations;

namespace ResourceManagmentsystem.Models
{
    public class Project
    {
        public int Id { get; set; }
        [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
        [MaxLength(2000)] public string? Description { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
        public int ProgressPercent { get; set; }                    // 0-100
        public bool IsPriority { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;

        public List<ProjectAssignment> Assignments { get; set; } = new();
        public List<TemporaryProjectAccess> TemporaryAccess { get; set; } = new();
    }

    /// <summary>Permanent membership of a user on a project.</summary>
    public class ProjectAssignment
    {
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime AssignedUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>A 4-day grant given by a manager/admin to a Normal user.</summary>
    public class TemporaryProjectAccess
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int GrantedByUserId { get; set; }
        public DateTime GrantedUtc { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresUtc { get; set; }
    }
}

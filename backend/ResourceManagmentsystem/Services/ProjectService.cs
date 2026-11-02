using Microsoft.EntityFrameworkCore;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;

namespace ResourceManagmentsystem.Services
{
    /// <summary>All "who can see / edit which project" rules live here so controllers stay thin.</summary>
    public class ProjectService
    {
        public const int TempAccessDays = 4;
        private readonly AppDbContext _db;

        public ProjectService(AppDbContext db) { _db = db; }

        private IQueryable<Project> WithRelations() => _db.Projects
            .Include(p => p.Assignments).ThenInclude(a => a.User)
            .Include(p => p.TemporaryAccess).ThenInclude(t => t.User)
            .AsSplitQuery();

        public async Task<Project?> FindAsync(int id, bool track = false)
        {
            var q = WithRelations();
            if (!track) q = q.AsNoTracking();
            return await q.FirstOrDefaultAsync(p => p.Id == id);
        }

        /// <summary>Admin/Manager see everything. A Normal user only sees assigned or temporarily-granted projects.</summary>
        public async Task<List<ProjectDto>> GetVisibleAsync(int userId, AccessLevel level)
        {
            var now = DateTime.UtcNow;
            var q = WithRelations().AsNoTracking();
            if (level == AccessLevel.Normal)
                q = q.Where(p => p.Assignments.Any(a => a.UserId == userId) ||
                                 p.TemporaryAccess.Any(t => t.UserId == userId && t.ExpiresUtc > now));

            var list = await q.OrderByDescending(p => p.IsPriority).ThenBy(p => p.Name).ToListAsync();
            return list.Select(p => Map(p, userId, level, now)).ToList();
        }

        public static bool CanView(Project p, int userId, AccessLevel level, DateTime now) =>
            level != AccessLevel.Normal ||
            p.Assignments.Any(a => a.UserId == userId) ||
            p.TemporaryAccess.Any(t => t.UserId == userId && t.ExpiresUtc > now);

        /// <summary>Admin: always. Anyone else: only when assigned or holding an unexpired temporary grant.</summary>
        public static bool CanEdit(Project p, int userId, AccessLevel level, DateTime now) =>
            level == AccessLevel.Admin ||
            p.Assignments.Any(a => a.UserId == userId) ||
            p.TemporaryAccess.Any(t => t.UserId == userId && t.ExpiresUtc > now);

        public static ProjectDto Map(Project p, int userId, AccessLevel level, DateTime now)
        {
            var assigned = p.Assignments.Any(a => a.UserId == userId);
            var temp = p.TemporaryAccess.FirstOrDefault(t => t.UserId == userId && t.ExpiresUtc > now);
            var accessType = level == AccessLevel.Admin ? "Full" : assigned ? "Assigned" : temp != null ? "Temporary" : "ViewOnly";

            var tempList = level == AccessLevel.Normal
                ? new List<TempAccessDto>()
                : p.TemporaryAccess.Where(t => t.ExpiresUtc > now)
                    .Select(t => new TempAccessDto(t.UserId, t.User.Name + " " + t.User.Surname, t.ExpiresUtc)).ToList();

            return new ProjectDto(
                p.Id, p.Name, p.Description, p.Status, p.ProgressPercent, p.IsPriority, p.DueDate, p.UpdatedUtc,
                accessType != "ViewOnly", accessType, accessType == "Temporary" ? (DateTime?)temp!.ExpiresUtc : null,
                p.Assignments.Select(a => new MemberDto(a.UserId, a.User.Name + " " + a.User.Surname))
                    .OrderBy(m => m.FullName).ToList(),
                tempList);
        }
    }
}

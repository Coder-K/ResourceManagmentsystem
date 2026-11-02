using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;
using ResourceManagmentsystem.Services;

namespace ResourceManagmentsystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ProjectService _projects;

        public ProjectController(AppDbContext context, ProjectService projects)
        {
            _context = context;
            _projects = projects;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProjectDto>>> GetProjects() =>
            await _projects.GetVisibleAsync(User.GetUserId(), User.GetAccessLevel());

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProjectDto>> GetProject(int id)
        {
            var p = await _projects.FindAsync(id);
            var now = DateTime.UtcNow;
            if (p is null || !ProjectService.CanView(p, User.GetUserId(), User.GetAccessLevel(), now)) return NotFound();
            return ProjectService.Map(p, User.GetUserId(), User.GetAccessLevel(), now);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ProjectDto>> AddProject(CreateProjectDto dto)
        {
            var p = new Project { Name = dto.Name.Trim(), Description = dto.Description?.Trim(), DueDate = dto.DueDate };
            if (dto.MemberIds is { Count: > 0 })
            {
                var valid = await _context.Users.Where(u => dto.MemberIds.Contains(u.Id) && u.IsActive).Select(u => u.Id).ToListAsync();
                p.Assignments.AddRange(valid.Select(uid => new ProjectAssignment { UserId = uid }));
            }
            _context.Projects.Add(p);
            await _context.SaveChangesAsync();
            return Created($"/api/project/{p.Id}", await Fresh(p.Id));
        }

        // Admin can change everything. Anyone else with edit rights (assigned / temporary access)
        // may change only description, status and progress.
        [HttpPut("{id:int}")]
        public async Task<ActionResult<ProjectDto>> UpdateProject(int id, UpdateProjectDto dto)
        {
            var uid = User.GetUserId();
            var level = User.GetAccessLevel();
            var now = DateTime.UtcNow;

            var p = await _projects.FindAsync(id, track: true);
            if (p is null || !ProjectService.CanView(p, uid, level, now)) return NotFound();
            if (!ProjectService.CanEdit(p, uid, level, now)) return Forbid();

            if (level == AccessLevel.Admin)
            {
                if (dto.Name != null) p.Name = dto.Name.Trim();
                if (dto.DueDate != null) p.DueDate = dto.DueDate;
            }
            else if ((dto.Name != null && dto.Name.Trim() != p.Name) ||
                     (dto.DueDate != null && dto.DueDate.Value.Date != p.DueDate?.Date))
            {
                return Forbid();                                   // name and due date are admin-only
            }

            var oldProgress = p.ProgressPercent;
            if (dto.Description != null) p.Description = dto.Description.Trim();
            if (dto.ProgressPercent.HasValue) p.ProgressPercent = dto.ProgressPercent.Value;
            if (dto.Status.HasValue) p.Status = dto.Status.Value;

            // Business rules that keep status and progress consistent
            if (dto.Status == ProjectStatus.Completed) p.ProgressPercent = 100;
            else if (p.ProgressPercent == 100 && p.ProgressPercent != oldProgress) p.Status = ProjectStatus.Completed;
            else if (p.Status == ProjectStatus.Completed && p.ProgressPercent < 100) p.Status = ProjectStatus.Active;
            else if (dto.Status.HasValue && p.Status != ProjectStatus.Completed && p.ProgressPercent == 100) p.ProgressPercent = 99;
            if (p.Status == ProjectStatus.Planning && p.ProgressPercent > 0) p.Status = ProjectStatus.Active;

            p.UpdatedUtc = now;
            await _context.SaveChangesAsync();
            return await Fresh(id);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var n = await _context.Projects.Where(p => p.Id == id).ExecuteDeleteAsync();
            return n == 0 ? NotFound() : NoContent();
        }

        [HttpPut("{id:int}/priority")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ProjectDto>> SetPriority(int id, SetPriorityDto dto)
        {
            var n = await _context.Projects.Where(p => p.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsPriority, dto.IsPriority));
            if (n == 0) return NotFound();
            return await Fresh(id);
        }

        // replace the permanent team (Admin only)
        [HttpPut("{id:int}/members")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ProjectDto>> SetMembers(int id, SetMembersDto dto)
        {
            var p = await _context.Projects.Include(x => x.Assignments).FirstOrDefaultAsync(x => x.Id == id);
            if (p is null) return NotFound();

            var valid = await _context.Users.Where(u => dto.UserIds.Contains(u.Id) && u.IsActive).Select(u => u.Id).ToListAsync();
            p.Assignments.RemoveAll(a => !valid.Contains(a.UserId));
            foreach (var uid in valid.Where(uid => p.Assignments.All(a => a.UserId != uid)))
                p.Assignments.Add(new ProjectAssignment { UserId = uid });

            await _context.SaveChangesAsync();
            return await Fresh(id);
        }

        // give a Normal user access to a project for 4 days (Manager or Admin)
        [HttpPost("{id:int}/temp-access")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ProjectDto>> GrantTemporaryAccess(int id, GrantAccessDto dto)
        {
            var target = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.UserId);
            if (target is null || !target.IsActive) return Problem("User not found.", statusCode: 400);
            if (target.AccessLevel != AccessLevel.Normal)
                return Problem("Temporary access can only be granted to Normal users.", statusCode: 400);

            var p = await _context.Projects.Include(x => x.Assignments).Include(x => x.TemporaryAccess)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (p is null) return NotFound();
            if (p.Assignments.Any(a => a.UserId == dto.UserId))
                return Problem("That user is already a member of this project.", statusCode: 400);

            var now = DateTime.UtcNow;
            var existing = p.TemporaryAccess.FirstOrDefault(t => t.UserId == dto.UserId && t.ExpiresUtc > now);
            if (existing != null)
            {
                existing.ExpiresUtc = now.AddDays(ProjectService.TempAccessDays);   // renewing restarts the 4 days
                existing.GrantedByUserId = User.GetUserId();
            }
            else
            {
                p.TemporaryAccess.RemoveAll(t => t.UserId == dto.UserId);           // purge this user's expired rows
                p.TemporaryAccess.Add(new TemporaryProjectAccess
                {
                    UserId = dto.UserId,
                    GrantedByUserId = User.GetUserId(),
                    GrantedUtc = now,
                    ExpiresUtc = now.AddDays(ProjectService.TempAccessDays)
                });
            }
            await _context.SaveChangesAsync();
            return await Fresh(id);
        }

        [HttpDelete("{id:int}/temp-access/{userId:int}")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<ProjectDto>> RevokeTemporaryAccess(int id, int userId)
        {
            await _context.TemporaryProjectAccesses.Where(t => t.ProjectId == id && t.UserId == userId).ExecuteDeleteAsync();
            return await Fresh(id);
        }

        private async Task<ProjectDto> Fresh(int id)
        {
            var p = (await _projects.FindAsync(id))!;
            return ProjectService.Map(p, User.GetUserId(), User.GetAccessLevel(), DateTime.UtcNow);
        }
    }
}

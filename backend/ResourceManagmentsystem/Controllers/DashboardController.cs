using Microsoft.AspNetCore.Mvc;
using ResourceManagmentsystem.Models;
using ResourceManagmentsystem.Services;

namespace ResourceManagmentsystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ProjectService _projects;

        public DashboardController(ProjectService projects) { _projects = projects; }

        // All numbers are calculated here, not in React. Normal users get their own projects;
        // managers and admins get every project. The list holds in-progress (not completed)
        // projects, priority ones first.
        [HttpGet]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            var all = await _projects.GetVisibleAsync(User.GetUserId(), User.GetAccessLevel());
            var now = DateTime.UtcNow;

            var running = all.Where(p => p.Status != ProjectStatus.Completed)
                .OrderByDescending(p => p.IsPriority)
                .ThenBy(p => p.DueDate ?? DateTime.MaxValue)
                .ToList();

            return new DashboardDto(
                TotalProjects: all.Count,
                RunningProjects: running.Count,
                CompletedProjects: all.Count - running.Count,
                OverdueProjects: running.Count(p => p.DueDate.HasValue && p.DueDate < now),
                AverageProgress: running.Count == 0 ? 0 : (int)Math.Round(running.Average(p => p.ProgressPercent)),
                StatusBreakdown: Enum.GetValues<ProjectStatus>().ToDictionary(s => s.ToString(), s => all.Count(p => p.Status == s)),
                Projects: running);
        }
    }
}

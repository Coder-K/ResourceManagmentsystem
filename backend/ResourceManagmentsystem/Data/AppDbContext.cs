namespace ResourceManagmentsystem.Data
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
    using ResourceManagmentsystem.Models;

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectAssignment> ProjectAssignments { get; set; }
        public DbSet<TemporaryProjectAccess> TemporaryProjectAccesses { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }

        // SQLite has no real date type. This makes every DateTime come back flagged as UTC so the JSON
        // ends in "Z" and the browser converts it to local time correctly.
        protected override void ConfigureConventions(ModelConfigurationBuilder builder)
            => builder.Properties<DateTime>().HaveConversion<UtcConverter>();

        protected override void OnModelCreating(ModelBuilder m)
        {
            m.Entity<User>().HasIndex(u => u.Email).IsUnique();

            m.Entity<ProjectAssignment>(e =>
            {
                e.HasKey(a => new { a.ProjectId, a.UserId });
                e.HasOne(a => a.Project).WithMany(p => p.Assignments).HasForeignKey(a => a.ProjectId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.User).WithMany(u => u.Assignments).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            m.Entity<TemporaryProjectAccess>(e =>
            {
                e.HasIndex(t => new { t.ProjectId, t.UserId });
                e.HasOne(t => t.Project).WithMany(p => p.TemporaryAccess).HasForeignKey(t => t.ProjectId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            m.Entity<UserSession>()
                .HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class UtcConverter : ValueConverter<DateTime, DateTime>
    {
        public UtcConverter() : base(
            v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        { }
    }
}

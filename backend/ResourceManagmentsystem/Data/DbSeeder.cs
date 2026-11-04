using Microsoft.EntityFrameworkCore;
using ResourceManagmentsystem.Models;
using ResourceManagmentsystem.Services;

namespace ResourceManagmentsystem.Data
{
    /// <summary>Makes sure there is a first admin, and (optionally, for development) some demo data.</summary>
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext db, PasswordService passwords, IConfiguration cfg, ILogger logger)
        {
            // 1. first admin
            if (!await db.Users.AnyAsync(u => u.AccessLevel == AccessLevel.Admin && u.IsActive))
            {
                var email = cfg["Seed:AdminEmail"]?.Trim().ToLowerInvariant();
                var password = cfg["Seed:Password"];
                if (string.IsNullOrWhiteSpace(email) || PasswordService.Validate(password, email) is not null)
                    throw new InvalidOperationException(
                        "There is no active admin account. Set Seed:AdminEmail and a policy-compliant Seed:AdminPassword " +
                        "(environment variables Seed__AdminEmail / Password) so one can be created.");

                if (await db.Users.AnyAsync(u => u.Email == email))
                    throw new InvalidOperationException($"Seed:AdminEmail ({email}) already belongs to a non-admin user. Use a different email.");

                db.Users.Add(NewUser(passwords, cfg["Seed:AdminName"] ?? "System", "Administrator", email, "0000000000", password!, AccessLevel.Admin));
                await db.SaveChangesAsync();
                logger.LogInformation("Created first admin {Email}", email);
            }

            // 2. development demo data
            if (!cfg.GetValue<bool>("Seed:DemoData") || await db.Projects.AnyAsync()) return;

            var demoPw = cfg["Seed:DemoPassword"] ?? "Demo#Pass2026!";
            var manager = await GetOrAdd(db, passwords, "Morgan", "Manager", "managerTest@rms.local", "0821112222", demoPw, AccessLevel.Manager);
            var alice = await GetOrAdd(db, passwords, "Alice", "Coder", "onlyOther@rms.local", "0823334444", demoPw, AccessLevel.Normal);
           
            var now = DateTime.UtcNow;
            Project P(string n, string d, ProjectStatus s, int pct, bool pri, int dueDays, params User[] members) => new()
            {
                Name = n, Description = d, Status = s, ProgressPercent = pct, IsPriority = pri, DueDate = now.AddDays(dueDays),
                Assignments = members.Select(u => new ProjectAssignment { UserId = u.Id }).ToList()
            };

            db.Projects.AddRange(
                P("Payments API Rewrite", "Move the payment endpoints to the new gateway and add idempotency keys.", ProjectStatus.Active, 65, true, 21, alice, manager));
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded demo users and projects");
        }

        private static async Task<User> GetOrAdd(AppDbContext db, PasswordService pw, string name, string surname,
                                                 string email, string contact, string password, AccessLevel level)
        {
            var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existing != null) return existing;
            var u = NewUser(pw, name, surname, email, contact, password, level);
            db.Users.Add(u);
            await db.SaveChangesAsync();
            return u;
        }

        private static User NewUser(PasswordService pw, string name, string surname, string email,
                                    string contact, string password, AccessLevel level)
        {
            var u = new User { Name = name, Surname = surname, Email = email, Contact = contact, AccessLevel = level };
            u.PasswordHash = pw.Hash(u, password);
            return u;
        }
    }
}

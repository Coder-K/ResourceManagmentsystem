namespace ResourceManagmentsystem.Data
{
    using System;
    using Microsoft.EntityFrameworkCore;
    using ResourceManagmentsystem.Models;
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

        public DbSet<User> Users { get; set; }
    }
}

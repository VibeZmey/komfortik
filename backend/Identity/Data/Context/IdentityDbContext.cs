using Identity.Data.Configurations;
using Identity.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Identity.Data.Context;

public class IdentityDbContext(DbContextOptions<IdentityDbContext> options) 
    : DbContext(options), IIdentityDbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }
    public async Task SeedRolesAsync()
    {
        if (!await Roles.AnyAsync())
        {
            var roles = new[]
            {
                new Role { Id = Guid.NewGuid(), Name = "Admin" },
                new Role { Id = Guid.NewGuid(), Name = "User" },
                new Role { Id = Guid.NewGuid(), Name = "Supporter" },
            };
            
            await Roles.AddRangeAsync(roles);
            await SaveChangesAsync();
        }
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RoleConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
        modelBuilder.ApplyConfiguration(new EmailVerificationTokenConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
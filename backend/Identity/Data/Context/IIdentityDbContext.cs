using Identity.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Identity.Data.Context;

public interface IIdentityDbContext
{
    Task SeedRolesAsync();
    DbSet<User> Users { get; set; }
    DbSet<Role> Roles { get; set; }
    DbSet<RefreshToken> RefreshTokens { get; set; }
    DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
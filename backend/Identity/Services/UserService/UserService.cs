using Identity.Data.Context;
using Identity.Data.Models;
using Identity.Dto;
using Identity.Services.EmailTokenService;
using Identity.Services.JwtService;
using Identity.Services.Publishers;
using MassTransit;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SharedContracts.Messages;

namespace Identity.Services.UserService;

internal class UserService : IUserService
{
    private readonly IIdentityDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ILogger<UserService> _logger;
    private readonly IEmailTokenService _emailTokenService;
    private readonly IPublisher _publisher;
    
    public UserService(IIdentityDbContext context, 
        IJwtService jwtService,
        ILogger<UserService> logger,
        IEmailTokenService emailTokenService,
        IPublisher publisher)
    {
        _emailTokenService = emailTokenService;
        _jwtService = jwtService;
        _context = context;
        _logger = logger;
        _publisher = publisher;
    }

    public async Task ChangePassword(Guid userId, string oldPassword, string newPassword, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        
        if (user is null)
            throw new Exception("User is not found");
        
        var result = new PasswordHasher<User>()
            .VerifyHashedPassword(user, user.PasswordHash, oldPassword);

        if (result == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("ChangePasswordFailed: InvalidOldPassword UserId={UserId}", userId);
            throw new Exception("Old password is incorrect");
        }
        
        var passHash = new PasswordHasher<User>().HashPassword(user, newPassword);
        user.PasswordHash = passHash;
        await _context.SaveChangesAsync(ct);
    }

    public async Task BlockUser(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if(user is null)
            throw new Exception("User is not found");
        
        user.IsBlocked = true;
        await _context.SaveChangesAsync(ct);
    }
    
    public async Task Register(RegisterRequest user, CancellationToken ct = default)
    {
        var checkUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == user.Email, ct);
        
        if (checkUser is not null && checkUser.EmailConfirmed)
            throw new Exception("User is already exist");
        
        User newUser = new User()
        {
            Id = Guid.NewGuid(),
            Email = user.Email,
            CreatedAt = DateTime.UtcNow,
        };
        var passHash = new PasswordHasher<User>().HashPassword(newUser, user.Password);
        newUser.PasswordHash = passHash;
        
        var role = await _context
            .Roles
            .AsNoTracking()
            .FirstAsync(r => 
                r.Name == "User", ct);

        newUser.RoleId = role.Id;
        
        await _context.Users.AddAsync(newUser, ct);
        await _context.SaveChangesAsync(ct);
        
        var token = await _emailTokenService.GenerateToken(newUser.Id, user.Email, ct);
        var callbackUrl = $"http://localhost:8081/auth/confirm-email?token={Uri.EscapeDataString(token)}";
        
        var msg = new UserRegistered()
        {
            Email = user.Email,
            ConfirmationLink = callbackUrl,
            CreatedAt = DateTime.UtcNow,
        };

        await _publisher.PublishAsync("user-registered", msg.Email, msg, ct);
        _logger.LogInformation("RegistrationSuccess: UserId={UserId}", newUser.Id);
    }

    public async Task<JwtResponse?> ConfirmEmail(string token, CancellationToken ct = default)
    {
        var payload = await _emailTokenService.ValidateToken(token, ct);

        if (payload is null)
        {
            _logger.LogWarning("EmailConfirmationFailed: InvalidToken");
            throw new Exception("Invalid token");
        }
        
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == payload.UserId, ct);
        
        if (user is null)
            throw new Exception("User is not found");

        user.EmailConfirmed = true;
        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("EmailConfirmationSuccess: UserId={UserId}", user.Id);
        return await _jwtService.GenerateJwt(user);
        
    }

    public async Task<bool> Login(LoginRequest loginUser, CancellationToken ct = default)
    {
        User? user = await _context
            .Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u=> 
                u.Email == loginUser.Email, ct);

        if (user is null || user.IsBlocked)
            return false;
        
        var result = new PasswordHasher<User>()
            .VerifyHashedPassword(user, user.PasswordHash, loginUser.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("LoginFailed: InvalidPassword UserId={UserId}", user.Id);
            return false;
        }
        
        var token = await _emailTokenService.GenerateToken(user.Id, user.Email, ct);
        var callbackUrl = $"http://localhost:3000/auth/confirm-email?token={Uri.EscapeDataString(token)}";

        var msg = new UserLoggedin()
        {
            Email = user.Email,
            ConfirmationLink = callbackUrl,
            CreatedAt = DateTime.UtcNow,
        };

        await _publisher.PublishAsync("user-loggedin", msg.Email, msg, ct);
        _logger.LogInformation("LoginSuccess: UserId={UserId}", user.Id);
        return true;
    }

    public async Task<List<UserDto>> GetAll(CancellationToken ct = default)
    {
        return await _context.Users
            .Include(u => u.Role)
            .Select(user => new UserDto()
            {
                Id = user.Id,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                Role = user.Role.Name,
                Country = user.Country,
                IsBlocked = user.IsBlocked
            })
            .ToListAsync(ct);
    }
    
    public async Task<GetUserResponse?> GetUserById(Guid id, CancellationToken ct = default)
    {
        var user = await _context
            .Users
            .FindAsync(id, ct);

        GetUserResponse response = new GetUserResponse()
        {
            Id = user.Id,
            RoleId = user.RoleId,
            Email = user.Email,
            Country = user.Country,
            Citizenship = user.Citizenship,
            Currency = user.Currency,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            IsBlocked = user.IsBlocked,
        };
        
        return response;
    }

    public async Task Logout(Guid userId, CancellationToken ct = default)
    {
        await _jwtService.RevokeRefreshs(userId, ct);
        await _context.SaveChangesAsync(ct);
    }
    
}
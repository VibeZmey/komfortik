using Identity.Dto;

namespace Identity.Services.UserService;

public interface IUserService
{
    Task Logout(Guid userId, CancellationToken ct = default);
    Task<GetUserResponse?> GetUserById(Guid id, CancellationToken ct = default);
    Task<bool> Login(LoginRequest loginUser, CancellationToken ct = default);
    Task Register(RegisterRequest user, CancellationToken ct = default);
    Task<JwtResponse?> ConfirmEmail(string token, CancellationToken ct = default);
    Task ChangePassword(Guid userId, string oldPassword, string newPassword, CancellationToken ct = default);
    Task<List<UserDto>> GetAll(CancellationToken ct = default);
    Task BlockUser(Guid userId, CancellationToken ct = default);
}
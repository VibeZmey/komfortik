using Identity.Dto;
using Identity.Services.UserService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Controllers;

[ApiController]
[Authorize]
[Route("users")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [Authorize(Roles = "User, Admin, Supporter")]
    [HttpPost("change/password")]
    public async Task<ActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst("userId").Value);
        await _userService
            .ChangePassword(userId, request.OldPassword, request.NewPassword, cancellationToken);
        return Ok();
    }
    
    [Authorize(Roles = "User, Admin, Supporter")]
    [HttpGet("me")]
    public async Task<ActionResult<GetUserResponse>> GetMe()
    {
        var userId = User.FindFirst("userId").Value;

        var user = await _userService.GetUserById(Guid.Parse(userId));
        return Ok(user);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserDto>>> GetAllUsers()
    {
        return Ok(await _userService.GetAll());
    }

    [HttpPost("{id:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid id, CancellationToken cancellationToken)
    {
        await _userService.BlockUser(id);
        return Ok();
    }
}
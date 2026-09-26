using Identity.Data.Context;
using Identity.Data.Models;
using Identity.Dto;
using Identity.Services.JwtService;
using Identity.Services.UserService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Controllers;

[ApiController]
[Authorize]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;
    private readonly IIdentityDbContext _context;
    
    
    public AuthController(
        IUserService userService, 
        IJwtService jwtService,
        IIdentityDbContext context)
    {
        _userService = userService;
        _jwtService = jwtService;
        _context = context;
    }
    
    // [HttpPost("login/admin")]
    // [AllowAnonymous]
    // public async Task<ActionResult<JwtResponse>> LoginAdmin([FromBody] LoginRequest request)
    // {
    //     
    //     var res = await _jwtService.GenerateJwt(new User()
    //     {
    //         Id = Guid.Parse("c4d573f8-8d8d-4bfa-bfc6-23ae2095c72a"),
    //         PasswordHash = "AQAAAAIAAYagAAAAENpISed1Tbx+rT7szMMrXUQnOsqNWhtTEEXGjLgq8MWj+TL1fcxOe1E9Lai+Cal3VA==",
    //         Email = "zmeev.i.v@yandex.ru",
    //         IsBlocked = false,
    //         RoleId = Guid.Parse("200bb45f-533a-4473-a4c1-2f9112994070"),
    //         CreatedAt = DateTime.Parse("2026-05-11 22:02:32.772834 +00:00"),
    //         EmailConfirmed = true
    //     });
    //     return Ok(res);
    // }
    
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request)
    {
        await _userService.Register(request);
        return Ok();
    }
    
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        var res = await _userService.Login(request);
        return res ? Ok() : Unauthorized();
    }
    
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<JwtResponse>> Refresh([FromBody] string token)
    {
        var res = await _jwtService.ValidateRefreshJwt(token);
        return res is null ? Unauthorized() : Ok(res);
    }

    [HttpPost("email-confirm")]
    [AllowAnonymous]
    public async Task<ActionResult<JwtResponse>> EmailConfirm([FromQuery] string token)
    {
        var res = await _userService.ConfirmEmail(token);
        return res is null ? Unauthorized() : Ok(res);
    }
    
    [HttpDelete("users")]
    [AllowAnonymous]
    public async Task<ActionResult<JwtResponse>> DeleteUsers()
    {
        _context.Users.RemoveRange(_context.Users);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
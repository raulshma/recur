using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly RecurDbContext _context;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        RecurDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto model)
    {
        if (await _userManager.FindByEmailAsync(model.Email) != null)
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Email is already registered"
            });
        }

        var user = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            TimeZone = model.TimeZone ?? "UTC",
            Currency = model.Currency
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            // Create default user settings
            var settings = new UserSettings
            {
                UserId = user.Id,
                DefaultCurrency = model.Currency,
                TimeZone = model.TimeZone ?? "UTC"
            };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();

            var token = await GenerateJwtToken(user);
            
            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful",
                Token = token.Token,
                Expires = token.Expires,
                User = MapToUserDto(user)
            });
        }

        return BadRequest(new AuthResponseDto
        {
            Success = false,
            Message = string.Join(", ", result.Errors.Select(e => e.Description))
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "Invalid email or password"
            });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (result.Succeeded)
        {
            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var token = await GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token.Token,
                Expires = token.Expires,
                User = MapToUserDto(user)
            });
        }

        return Unauthorized(new AuthResponseDto
        {
            Success = false,
            Message = "Invalid email or password"
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<AuthResponseDto>> ChangePassword(ChangePasswordDto model)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "User not found"
            });
        }

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (result.Succeeded)
        {
            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Password changed successfully"
            });
        }

        return BadRequest(new AuthResponseDto
        {
            Success = false,
            Message = string.Join(", ", result.Errors.Select(e => e.Description))
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(MapToUserDto(user));
    }

    private async Task<(string Token, DateTime Expires)> GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new("firstName", user.FirstName ?? ""),
            new("lastName", user.LastName ?? "")
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var expirationMinutes = int.Parse(jwtSettings["ExpirationInMinutes"] ?? "60");
        var expires = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            TimeZone = user.TimeZone,
            Currency = user.Currency,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
} 
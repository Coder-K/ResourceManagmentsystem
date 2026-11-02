using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;
using ResourceManagmentsystem.Services;

namespace ResourceManagmentsystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int MaxFailedAttempts = 5;
        private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

        private readonly AppDbContext _context;
        private readonly TokenProvider _tokenProvider;
        private readonly SessionService _sessions;
        private readonly PasswordService _passwords;
        private readonly JwtSettings _jwt;
        private readonly ILogger<AuthController> _log;

        public AuthController(AppDbContext context, TokenProvider tokenProvider, SessionService sessions,
                              PasswordService passwords, IOptions<JwtSettings> jwt, ILogger<AuthController> log)
        {
            _context = context;
            _tokenProvider = tokenProvider;
            _sessions = sessions;
            _passwords = passwords;
            _jwt = jwt.Value;
            _log = log;
        }

        // requesting for login and generating the token
        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user is null)
            {
                _passwords.BurnTime(dto.Password);
                return BadCredentials();
            }

            if (user.LockoutEndUtc > DateTime.UtcNow || !user.IsActive)
            {
                _log.LogWarning("Login blocked for user {UserId} (locked or inactive)", user.Id);
                return BadCredentials();
            }

            var result = _passwords.Verify(user, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= MaxFailedAttempts)
                {
                    user.LockoutEndUtc = DateTime.UtcNow.Add(LockoutDuration);
                    user.FailedLoginCount = 0;
                    _log.LogWarning("User {UserId} locked out after repeated failures", user.Id);
                }
                await _context.SaveChangesAsync();
                return BadCredentials();
            }

            if (result == PasswordVerificationResult.SuccessRehashNeeded)
                user.PasswordHash = _passwords.Hash(user, dto.Password);   // upgrade old hashes silently

            user.FailedLoginCount = 0;
            user.LockoutEndUtc = null;
            await _context.SaveChangesAsync();

            var session = await _sessions.CreateAsync(user);
            var token = _tokenProvider.GenerateToken(user, session.Id, session.ExpiresUtc);
            return new LoginResponseDto(token, session.ExpiresUtc, _jwt.IdleTimeoutMinutes, Mapping.ToDto(user));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _sessions.RevokeAsync(User.GetSessionId());
            return NoContent();
        }

        /// <summary>The current user. The front end also calls this as a keep-alive.</summary>
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> Me()
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == User.GetUserId());
            if (user is null) return Unauthorized();
            return Mapping.ToDto(user);
        }

        // same message for every failure so attackers cannot tell which emails exist
        private ObjectResult BadCredentials() =>
            Problem(detail: "Invalid email or password, or the account is temporarily locked.",
                    statusCode: 401, title: "Login failed");
    }
}

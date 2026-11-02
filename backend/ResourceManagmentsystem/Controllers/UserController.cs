using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;
using ResourceManagmentsystem.Services;

namespace ResourceManagmentsystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SessionService _sessions;
        private readonly PasswordService _passwords;

        public UserController(AppDbContext context, SessionService sessions, PasswordService passwords)
        {
            _context = context;
            _sessions = sessions;
            _passwords = passwords;
        }

        // getting all the users in the system (Manager, Admin)
        [HttpGet]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<List<UserDto>>> GetUsers() =>
            await _context.Users.AsNoTracking().OrderBy(u => u.Name).ThenBy(u => u.Surname)
                .Select(u => new UserDto(u.Id, u.Name, u.Surname, u.Email, u.Contact, u.AccessLevel, u.IsActive, u.CreatedUtc))
                .ToListAsync();

        // getting the user details by id (yourself, or Manager/Admin)
        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserDto>> GetUserById(int id)
        {
            if (User.GetUserId() != id && User.GetAccessLevel() == AccessLevel.Normal) return Forbid();
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();
            return Mapping.ToDto(user);
        }

        // adding new user to the system. Managers can only create Normal users; Admins can pick any level.
        [HttpPost]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<ActionResult<UserDto>> AddUser(CreateUserDto dto)
        {
            var level = dto.AccessLevel ?? AccessLevel.Normal;
            if (User.GetAccessLevel() != AccessLevel.Admin && level != AccessLevel.Normal) return Forbid();

            var email = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email == email))
                return Problem("That email address is already registered.", statusCode: 409);

            var pwError = PasswordService.Validate(dto.Password, email);
            if (pwError != null) return Problem(pwError, statusCode: 400, title: "Weak password");

            var user = new User
            {
                Name = dto.Name.Trim(),
                Surname = dto.Surname.Trim(),
                Email = email,
                Contact = dto.Contact.Trim(),
                AccessLevel = level
            };
            user.PasswordHash = _passwords.Hash(user, dto.Password);

            _context.Users.Add(user);
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException) { return Problem("That email address is already registered.", statusCode: 409); }

            return Created($"/api/user/{user.Id}", Mapping.ToDto(user));
        }

        // updating the user details.
        //  - anyone: their own name / email / contact
        //  - Manager: name / email / contact of Normal users and other Managers (never Admins)
        //  - Admin: everything, including access level, active flag and resetting someone's password
        [HttpPut("{id:int}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, UpdateUserDto dto)
        {
            var callerId = User.GetUserId();
            var callerLevel = User.GetAccessLevel();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();

            var isSelf = callerId == id;
            var allowed = isSelf || callerLevel == AccessLevel.Admin ||
                          (callerLevel == AccessLevel.Manager && user.AccessLevel != AccessLevel.Admin);
            if (!allowed) return Forbid();

            var email = dto.Email.Trim().ToLowerInvariant();
            if (email != user.Email && await _context.Users.AnyAsync(u => u.Email == email && u.Id != id))
                return Problem("That email address is already in use.", statusCode: 409);

            if (dto.AccessLevel.HasValue && dto.AccessLevel.Value != user.AccessLevel)
            {
                if (callerLevel != AccessLevel.Admin) return Forbid();               // only admins change levels
                if (user.AccessLevel == AccessLevel.Admin && await IsLastActiveAdmin(id))
                    return Problem("At least one active admin must remain.", statusCode: 400);
                user.AccessLevel = dto.AccessLevel.Value;                            // old tokens now fail the role check
            }

            if (dto.IsActive.HasValue && dto.IsActive.Value != user.IsActive)
            {
                if (callerLevel != AccessLevel.Admin) return Forbid();
                if (isSelf) return Problem("You cannot deactivate your own account.", statusCode: 400);
                if (!dto.IsActive.Value && user.AccessLevel == AccessLevel.Admin && await IsLastActiveAdmin(id))
                    return Problem("At least one active admin must remain.", statusCode: 400);
                user.IsActive = dto.IsActive.Value;
            }

            var passwordReset = false;
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                if (isSelf) return Problem("Use the change-password form to change your own password.", statusCode: 400);
                if (callerLevel != AccessLevel.Admin) return Forbid();               // managers cannot touch others' passwords
                var pwError = PasswordService.Validate(dto.NewPassword, email);
                if (pwError != null) return Problem(pwError, statusCode: 400, title: "Weak password");
                user.PasswordHash = _passwords.Hash(user, dto.NewPassword);
                user.FailedLoginCount = 0;
                user.LockoutEndUtc = null;
                passwordReset = true;
            }

            user.Name = dto.Name.Trim();
            user.Surname = dto.Surname.Trim();
            user.Email = email;
            user.Contact = dto.Contact.Trim();
            await _context.SaveChangesAsync();

            if (passwordReset) await _sessions.RevokeAllForUserAsync(user.Id);
            return Mapping.ToDto(user);
        }

        // anyone (Normal, Manager, Admin) may change their OWN password after proving the current one
        [HttpPost("me/password")]
        public async Task<IActionResult> ChangeOwnPassword(ChangePasswordDto dto)
        {
            var user = await _context.Users.FirstAsync(u => u.Id == User.GetUserId());

            if (_passwords.Verify(user, dto.CurrentPassword) == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
                return Problem("Your current password is incorrect.", statusCode: 400, title: "Password not changed");
            if (dto.NewPassword == dto.CurrentPassword)
                return Problem("The new password must be different from the current one.", statusCode: 400);

            var pwError = PasswordService.Validate(dto.NewPassword, user.Email);
            if (pwError != null) return Problem(pwError, statusCode: 400, title: "Weak password");

            user.PasswordHash = _passwords.Hash(user, dto.NewPassword);
            await _context.SaveChangesAsync();
            await _sessions.RevokeAllForUserAsync(user.Id, exceptSessionId: User.GetSessionId());   // sign out other devices
            return NoContent();
        }

        // deleting the user from the system (Admin only)
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (id == User.GetUserId()) return Problem("You cannot delete your own account.", statusCode: 400);

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            if (user.AccessLevel == AccessLevel.Admin && await IsLastActiveAdmin(id))
                return Problem("At least one active admin must remain.", statusCode: 400);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<bool> IsLastActiveAdmin(int id) =>
            !await _context.Users.AnyAsync(u => u.Id != id && u.AccessLevel == AccessLevel.Admin && u.IsActive);
    }
}

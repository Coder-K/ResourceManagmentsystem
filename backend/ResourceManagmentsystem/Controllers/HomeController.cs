using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;

namespace ResourceManagmentsystem.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }
        // adding new user to the system
        //[Authorize]
        [HttpPost]
        public IActionResult AddUser(UserDto dto)
        {
            var hasher = new PasswordHasher<User>();

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Contact = dto.Contact,
                AccessLevel = dto.AccessLevel
            };

            user.PasswordHash = hasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(user);
        }

        // requesting for login and genrating the token

        [HttpPost("login")]
        public IActionResult Login(LoginDto dto)
        {
            //authenticating the user
            var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);

            if (user == null)
                return Unauthorized("Invalid email or password");

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid email or password");

            // genrating the token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes("THIS_IS_MY_SECRET_KEY_12345");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("AccessLevel", user.AccessLevel.ToString())
        }),
                Expires = DateTime.UtcNow.AddHours(2),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new
            {
                token = tokenHandler.WriteToken(token)
            });
        }

        // getting all the users in the system

        [HttpGet]
        public IActionResult GetUsers()
        {

            var users = _context.Users
        .Select(u => new
        {
            u.Id,
            u.Name,
            u.Email,
            u.Contact,
            u.AccessLevel
        })
        .ToList();
            //return Ok(_context.Users.ToList());
            return Ok(users);
        }

        // deleting the user from the system

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.Find(id);
            if (user == null)
            {
                return NotFound();
            }
            _context.Users.Remove(user);
            _context.SaveChanges();
            return NoContent();
        }

        // updating the user details

        [HttpPut("{id}")]
       
        public IActionResult UpdateUser(int id, UserDto dto)
        {
            var user = _context.Users.Find(id);
            if (user == null)
            {
                return NotFound();
            }

            user.Name = dto.Name;
            user.Email = dto.Email;
            user.Contact = dto.Contact;
            user.AccessLevel = dto.AccessLevel;
            if (!string.IsNullOrEmpty(dto.Password))
            {
                var hasher = new PasswordHasher<User>();
                user.PasswordHash = hasher.HashPassword(user, dto.Password);
            }
            _context.Users.Update(user);
            _context.SaveChanges();
            return Ok(user);
        }


        // getting the user details by id

        [HttpGet("details/{id}")]
        public IActionResult GetUserById(int id)
        {
            var user = _context.Users.Find(id);
            if (user == null)
            {
                return NotFound();
            }
            var userDetails = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Contact,
                user.AccessLevel
            };


            return Ok(userDetails);
        }
    }
}
    
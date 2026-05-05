using Microsoft.AspNetCore.Http;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;
using Microsoft.AspNetCore.Identity;

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

        [HttpGet]
        public IActionResult GetUsers()
        {

            var users = _context.Users
        .Select(u => new {
            u.Id,
            u.Name,
            u.Email,
            u.Contact,
            u.AccessLevel
        })
        .ToList();
            return Ok(_context.Users.ToList());
        }

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
    }
}
    
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly JwtService _jwtService;

        public AuthController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            JwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var user = new IdentityUser { UserName = dto.Username };
            var result = await _userManager.CreateAsync(user, dto.Password);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToArray();
                return BadRequest(new { error = "Registration failed", details = errors });
            }

            var token = _jwtService.GenerateToken(dto.Username);
            return Ok(new { token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _signInManager.PasswordSignInAsync(dto.Username, dto.Password, false, false);

            if (!result.Succeeded)
            {
                return Unauthorized(new { error = "Invalid username or password" });
            }

            var token = _jwtService.GenerateToken(dto.Username);
            return Ok(new { token });
        }
    }
}
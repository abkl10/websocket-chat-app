using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Cors;
using backend.Services;
using Microsoft.Extensions.Logging;
using backend.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly JwtService _jwtService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(UserManager<IdentityUser> userManager, JwtService jwtService, ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _jwtService = jwtService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            try
            {
                _logger.LogInformation("Registration attempt for: {Username}", model.Username);

                // Validate model
                if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
                {
                    _logger.LogWarning("Registration failed: Username or password empty");
                    return BadRequest(new { message = "Username and password are required" });
                }

                var existingUser = await _userManager.FindByNameAsync(model.Username);
                if (existingUser != null)
                {
                    _logger.LogWarning("Registration failed: User already exists");
                    return BadRequest(new { message = "User already exists" });
                }

                var user = new IdentityUser { UserName = model.Username, Email = model.Username + "@chat.com" };
                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation("User registered successfully: {Username}", model.Username);
                    return Ok(new { message = "User registered successfully" });
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogWarning("Registration failed: {Errors}", errors);
                    return BadRequest(new { message = "Registration failed", errors = errors });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for {Username}", model.Username);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            try
            {
                _logger.LogInformation("Login attempt for: {Username}", model.Username);

                var user = await _userManager.FindByNameAsync(model.Username);
                if (user == null)
                {
                    _logger.LogWarning("Login failed: User not found");
                    return Unauthorized(new { message = "Invalid credentials" });
                }

                var result = await _userManager.CheckPasswordAsync(user, model.Password);
                if (!result)
                {
                    _logger.LogWarning("Login failed: Invalid password");
                    return Unauthorized(new { message = "Invalid credentials" });
                }

                var token = _jwtService.GenerateToken(user.UserName);
                _logger.LogInformation("Login successful for: {Username}", model.Username);

                return Ok(new { token = token, username = user.UserName });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for {Username}", model.Username);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
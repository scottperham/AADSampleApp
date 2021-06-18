using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SampleProject.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GetToken(string id, string name, string email, IDictionary<string, string> additionalClaims = null)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, id),
                new Claim(ClaimTypes.Name, name),
                new Claim(ClaimTypes.Email, email)
            };

            var handler = new JwtSecurityTokenHandler();

            var token = new JwtSecurityToken(null, _configuration["Jwt:Audience"], claims, DateTime.UtcNow.AddSeconds(-1), DateTime.UtcNow.AddMinutes(20), 
                new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"])), SecurityAlgorithms.HmacSha256Signature));

            return handler.WriteToken(token);
        }

        public RefreshToken GetRefreshToken()
        {
            return new RefreshToken
            {
                Token = Guid.NewGuid().ToString(),
                AbsoluteExpiryUtc = DateTime.UtcNow.AddMinutes(5)
            };
        }
    }
}

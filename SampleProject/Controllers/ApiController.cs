using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using SampleProject.Services;
using System.Security.Claims;

namespace SampleProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ApiController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly IIdentityProvider _identityProvider;
        private readonly DateTime _epoch = new DateTime(1970, 1, 1);
        private readonly Graph _graph;

        public ApiController(ITokenService tokenService, IIdentityProvider identityProvider, IConfiguration configuration)
        {
            _tokenService = tokenService;
            _identityProvider = identityProvider;

            _graph = new Graph(configuration);
        }

        static string ComputePasswordHash(string password, string email)
        {
            var byteResult = new Rfc2898DeriveBytes(password, Encoding.UTF8.GetBytes(email.ToLower()));

            return Convert.ToBase64String(byteResult.GetBytes(24));
        }

        LoginResult GetLoginResult(UserIdentity identity, RefreshToken refreshToken, string graphToken = null, bool requireLink = false)
        {
            var loginResult = new LoginResult
            {
                DisplayName = identity.DisplayName,
                GraphAccessToken = graphToken,
                RequireLink = requireLink
            };

            if (!requireLink)
            {
                loginResult.TokenExpiry = (int)(refreshToken.AbsoluteExpiryUtc - _epoch).TotalSeconds;
                loginResult.RefreshToken = refreshToken.Token;
                loginResult.AccessToken = _tokenService.GetToken(identity.Id, identity.DisplayName, identity.Email);
            }

            return loginResult;
        }

        [HttpPost("SignUp")]
        public async Task<IActionResult> SignUp([FromBody] CreateUserRequest request)
        {
            var identity = await _identityProvider.GetLocalUserByEmail(request.Email);

            if (identity != null)
            {
                return BadRequest("Email address already exists");
            }

            identity = new UserIdentity
            {
                Id = Guid.NewGuid().ToString(),
                DisplayName = request.DisplayName,
                Email = request.Email,
                Password = ComputePasswordHash(request.Password, request.Email),
                RefreshTokens = new List<RefreshToken>()
            };

            await _identityProvider.CreateOrUpdateUser(identity);

            return Ok();
        }

        [HttpPost("RefreshToken")]
        public async Task<IActionResult> LoginRefresh([FromBody] RefreshLoginRequest loginRequest)
        {
            var identity = await _identityProvider.GetUserByRefreshToken(loginRequest.Token);

            if (identity == null)
            {
                return NotFound();
            }

            var refreshToken = _tokenService.GetRefreshToken();

            identity.RemoveRefreshToken(loginRequest.Token);
            identity.AddRefreshToken(refreshToken);

            await _identityProvider.CreateOrUpdateUser(identity);

            return Ok(GetLoginResult(identity, refreshToken));
        }

        [HttpPost("LoginLocal")]
        public async Task<IActionResult> LoginLocally([FromBody] LocalLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("You must specify both email and password");
            }

            var identity = await _identityProvider.GetLocalUserByEmail(request.Email);

            if (identity == null)
            {
                return BadRequest("Email not found or password incorrect");
            }

            var hashedPassword = ComputePasswordHash(request.Password, identity.Email);

            if (hashedPassword != identity.Password)
            {
                return BadRequest("Email not found or password incorrect");
            }

            var refreshToken = _tokenService.GetRefreshToken();

            identity.AddRefreshToken(refreshToken);

            await _identityProvider.CreateOrUpdateUser(identity);

            return Ok(GetLoginResult(identity, refreshToken));
        }

        private async Task<LoginResult> LoginWithTokenInternal(string accessToken, bool shouldLink, bool saveLink)
        {
            var graphAccessToken = await _graph.GetOnBehalfOfToken(accessToken);

            var me = await _graph.GetMe(graphAccessToken);
            var org = await _graph.GetOrganisation(graphAccessToken);

            var identity = await _identityProvider.GetUserByOidAndTid(me.Id, org.Value[0].Id);

            if (identity == null)
            {
                identity = await _identityProvider.GetLocalUserByEmail(me.Mail);

                if (identity != null)
                {
                    if (!shouldLink)
                    {
                        //Do link flow...
                        return GetLoginResult(identity, null, graphAccessToken, true);
                    }

                    if (saveLink)
                    {
                        //Link!
                        identity.AADOID = me.Id;
                        identity.AADTID = org.Value[0].Id;
                    }
                    else
                    {
                        identity = null;
                    }
                }

                //No user at all...
                //fall through to create a new one
            }

            identity ??= new UserIdentity
            {
                Id = Guid.NewGuid().ToString(),
                DisplayName = me.DisplayName,
                Email = me.Mail,
                AADOID = me.Id,
                AADTID = org.Value[0].Id,
                RefreshTokens = new List<RefreshToken>()
            };

            var refreshToken = _tokenService.GetRefreshToken();

            identity.AddRefreshToken(refreshToken);

            await _identityProvider.CreateOrUpdateUser(identity);

            return GetLoginResult(identity, refreshToken, graphAccessToken);
        }

        [HttpPost("LinkWithIdentity")]
        public async Task<IActionResult> LinkWithIdentity([FromBody] LinkLoginRequest request)
        {
            var result = await LoginWithTokenInternal(request.AccessToken, true, request.Link);

            return Ok(result);
        }

        [HttpPost("LoginWithToken")]
        public async Task<IActionResult> LoginWithToken([FromBody] TokenLoginRequest request)
        {
            var result = await LoginWithTokenInternal(request.AccessToken, false, false);

            return Ok(result);
        }

        [HttpGet("Users")]
        [Authorize]
        public async Task<IActionResult> GetUsers()
        {
            var identities = await _identityProvider.GetAllUsers();

            return Ok(identities.Select(x => new UserIdentityResult
            {
                Id = x.Id,
                Email = x.Email,
                DisplayName = x.DisplayName,
                AADLinked = x.LinkedToAAD,
                LocalAccount = !string.IsNullOrEmpty(x.Password)
            }));
        }

        [HttpPost("Users/Delete")]
        [Authorize]
        public async Task<IActionResult> DeleteUser([FromBody] DeleteUserRequest request)
        {
            await _identityProvider.DeleteUser(request.Email);

            return Ok();
        }

        [HttpPost("Profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile([FromBody] GetProfileRequest request)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            var identity = await _identityProvider.GetUserById(idClaim.Value);

            GraphMeResult microsoftIdentity = null;

            if (!string.IsNullOrEmpty(request.AccessToken))
            {
                var graphAccessToken = await _graph.GetOnBehalfOfToken(request.AccessToken);

                microsoftIdentity = await _graph.GetMe(graphAccessToken);
            }

            return Ok(new
            {
                LocalIdentity = identity,
                MicrosoftIdentity = microsoftIdentity
            });
        }
    }

    public class GetProfileRequest
    {
        public string AccessToken { get; set; }
    }
}
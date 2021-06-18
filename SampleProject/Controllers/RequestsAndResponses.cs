namespace SampleProject.Controllers
{
    public class DeleteUserRequest
    {
        public string Email { get; set; }
    }

    public class CreateUserRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string DisplayName { get; set; }
    }

    public class GraphMeResult
    {
        public string Id { get; set; }
        public string DisplayName { get; set; }
        public string Mail { get; set; }
        public string GivenName { get; set; }
        public string Surname { get; set; }
    }

    public class GraphOrganizationResult
    {
        public GraphOrganization[] Value { get; set; }
    }

    public class GraphOrganization
    {
        public string Id { get; set; }
    }

    public class LocalLoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginResult
    {
        public bool RequireLink { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public int TokenExpiry { get; set; }
        public string DisplayName { get; set; }
        public string GraphAccessToken { get; set; }
    }

    public class RefreshLoginRequest
    {
        public string Token { get; set; }
    }

    public class TokenLoginRequest
    {
        public string AccessToken { get; set; }
    }

    public class LinkLoginRequest
    {
        public string AccessToken { get; set; }
        public bool Link { get; set; }
        public bool SaveLink { get; set; }
    }

    public class UserIdentityResult
    {
        public string Id { get; set; }
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public bool LocalAccount { get; set; }
        public bool AADLinked { get; set; }
    }
}

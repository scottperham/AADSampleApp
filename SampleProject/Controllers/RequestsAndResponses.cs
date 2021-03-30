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

    public class LocalLoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginResult
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public int TokenExpiry { get; set; }
        public string DisplayName { get; set; }
    }

    public class RefreshLoginRequest
    {
        public string Token { get; set; }
    }

    public class TokenLoginRequest
    {
        public string AccessToken { get; set; }
    }

    public class UserIdentityResult
    {
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public bool LocalAccount { get; set; }
        public bool AADLinked { get; set; }
    }
}

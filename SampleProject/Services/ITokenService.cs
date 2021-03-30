using System.Collections.Generic;

namespace SampleProject.Services
{
    public interface ITokenService
    {
        string GetToken(string name, string email, IDictionary<string, string> additionalClaims = null);
        RefreshToken GetRefreshToken();
    }
}

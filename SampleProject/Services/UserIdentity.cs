using System;
using System.Collections.Generic;

namespace SampleProject.Services
{
    public class UserIdentity
    {
        public string Id { get; set; }
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string AADOID { get; set; }
        public string AADTID { get; set; }
        public List<RefreshToken> RefreshTokens { get; set; }

        public bool LinkedToAAD => !string.IsNullOrEmpty(AADOID);

        public void AddRefreshToken(RefreshToken refreshToken)
        {
            RefreshTokens.RemoveAll(x => x.AbsoluteExpiryUtc < DateTime.UtcNow);
            RefreshTokens.Add(refreshToken);
        }

        public void RemoveRefreshToken(string token)
        {
            RefreshTokens.RemoveAll(x => x.AbsoluteExpiryUtc < DateTime.UtcNow || x.Token == token);
        }
    }
}

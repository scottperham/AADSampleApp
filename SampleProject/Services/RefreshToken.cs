using System;

namespace SampleProject.Services
{
    public class RefreshToken
    {
        public string Token { get; set; }
        public DateTime AbsoluteExpiryUtc { get; set; }
    }
}

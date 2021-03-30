using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Client;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using SampleProject.Controllers;

namespace SampleProject.Services
{
    public class Graph
    {
        public class GraphToken
        {
            public string Token { get; set; }
            public DateTimeOffset Expires { get; set; }

            public bool IsExpired() => Expires <= DateTime.UtcNow.AddSeconds(-30);
        }

        static Dictionary<string, GraphToken> _fakeCache = new Dictionary<string, GraphToken>(StringComparer.OrdinalIgnoreCase);

        private readonly IConfiguration _configuration;

        private HttpClient _httpClient = new HttpClient();

        public Graph(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void RemoveTokenForUser(string userId)
        {
            _fakeCache.Remove(userId);
        }

        public async Task<string> GetOnBehalfOfToken(string token)
        {
            var builder = ConfidentialClientApplicationBuilder.Create(_configuration["Msal:ClientId"])
                .WithClientSecret(_configuration["Msal:ClientSecret"])
                .WithRedirectUri(_configuration["Msal:RedirectUri"]);

            var client = builder.Build();

            var tokenBuilder = client.AcquireTokenOnBehalfOf(new[] { "User.Read" }, new UserAssertion(token));

            var result = await tokenBuilder.ExecuteAsync();

            return result.AccessToken;
        }

        public async Task<GraphMeResult> GetMe(string token)
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var meResult = await _httpClient.GetAsync("https://graph.microsoft.com/v1.0/me");

            return JsonSerializer.Deserialize<GraphMeResult>(await meResult.Content.ReadAsStringAsync(), new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }
    }
}
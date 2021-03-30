using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SampleProject.Services;

namespace SampleProject.Services
{
    public class JsonFileIdentityProvider : IIdentityProvider
    {
        string _filePath;
        List<UserIdentity> _cached = null;
        DateTime _cacheUpdated = DateTime.UtcNow;

        readonly JsonSerializerOptions _serializerOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public JsonFileIdentityProvider(string filePath)
        {
            _filePath = filePath;
        }

        async Task PopulateCache()
        {
            if (_cached == null || System.IO.File.GetLastWriteTimeUtc(_filePath) > _cacheUpdated)
            {
                if (!System.IO.File.Exists(_filePath))
                {
                    await System.IO.File.WriteAllTextAsync(_filePath, "[]");
                }

                using var fileStream = System.IO.File.OpenRead(_filePath);

                _cached = await JsonSerializer.DeserializeAsync<List<UserIdentity>>(fileStream, _serializerOptions);
                _cacheUpdated = System.IO.File.GetLastWriteTimeUtc(_filePath);
            }
        }

        async Task<bool> CommitCache()
        {
            if (System.IO.File.GetLastWriteTimeUtc(_filePath) > _cacheUpdated)
            {
                return false;
            }

            using var fileStream = System.IO.File.Open(_filePath, System.IO.FileMode.Truncate);

            await JsonSerializer.SerializeAsync(fileStream, _cached, _serializerOptions);

            _cacheUpdated = System.IO.File.GetLastWriteTimeUtc(_filePath);
            return true;
        }

        public async Task<UserIdentity> GetUserByEmail(string email)
        {
            await PopulateCache();

            return _cached.FirstOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        }

        public async Task<UserIdentity[]> GetAllUsers()
        {
            await PopulateCache();

            return _cached.ToArray();
        }

        public async Task<UserIdentity> GetUserByRefreshToken(string refreshToken)
        {
            await PopulateCache();

            return _cached.FirstOrDefault(x => x.RefreshTokens.FirstOrDefault(y => y.Token == refreshToken && y.AbsoluteExpiryUtc > DateTime.UtcNow) != null);
        }

        public async Task CreateOrUpdateUser(UserIdentity user)
        {
            await PopulateCache();

            var userIndex = _cached.FindIndex(x => x.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase));

            if (userIndex != -1){

                _cached.RemoveAt(userIndex);
                _cached.Insert(userIndex, user);
            }
            else
            {
                _cached.Add(user);
            }

            await CommitCache();
        }

        public async Task DeleteUser(string email)
        {
            await PopulateCache();

            _cached.RemoveAll(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        }
    }
}

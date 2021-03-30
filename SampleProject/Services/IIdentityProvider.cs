using System.Threading.Tasks;
using SampleProject.Controllers;

namespace SampleProject.Services
{
    public interface IIdentityProvider
    {
        Task<UserIdentity> GetUserByEmail(string email);
        Task<UserIdentity[]> GetAllUsers();
        Task CreateOrUpdateUser(UserIdentity user);
        Task<UserIdentity> GetUserByRefreshToken(string refreshToken);
        Task DeleteUser(string email);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Models;

namespace ResourceManagmentsystem.Services
{
    /// <summary>
    /// Implements "a token expires after 1 hour of not being used". A valid JWT signature is not
    /// enough: the matching session row must exist, be un-revoked and have been used recently.
    /// </summary>
    public class SessionService
    {
        private readonly AppDbContext _db;
        private readonly JwtSettings _settings;

        public SessionService(AppDbContext db, IOptions<JwtSettings> options)
        {
            _db = db;
            _settings = options.Value;
        }

        public async Task<UserSession> CreateAsync(User user)
        {
            var now = DateTime.UtcNow;
            // housekeeping: remove this user's dead sessions
            await _db.UserSessions
                .Where(x => x.UserId == user.Id && (x.RevokedUtc != null || x.ExpiresUtc < now))
                .ExecuteDeleteAsync();

            var session = new UserSession
            {
                UserId = user.Id,
                CreatedUtc = now,
                LastActivityUtc = now,
                ExpiresUtc = now.AddHours(_settings.AbsoluteLifetimeHours)
            };
            _db.UserSessions.Add(session);
            await _db.SaveChangesAsync();
            return session;
        }

        /// <summary>Called on every authenticated request from JwtBearer's OnTokenValidated event.</summary>
        public async Task<bool> ValidateAsync(string? sessionId, string? userId, string? role)
        {
            if (sessionId is null || !int.TryParse(userId, out var uid)) return false;

            var now = DateTime.UtcNow;
            var s = await _db.UserSessions.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == sessionId);
            if (s is null || s.UserId != uid || s.RevokedUtc != null || s.ExpiresUtc <= now) return false;

            if (now - s.LastActivityUtc > TimeSpan.FromMinutes(_settings.IdleTimeoutMinutes))
            {
                s.RevokedUtc = now;                        // idle too long: dead for good
                await _db.SaveChangesAsync();
                return false;
            }

            // Account disabled, or role changed since login => the token's claims are stale.
            if (!s.User.IsActive || s.User.AccessLevel.ToString() != role) return false;

            if (now - s.LastActivityUtc > TimeSpan.FromMinutes(1))   // slide the window (throttled to limit writes)
            {
                s.LastActivityUtc = now;
                await _db.SaveChangesAsync();
            }
            return true;
        }

        public Task RevokeAsync(string sessionId) =>
            _db.UserSessions.Where(x => x.Id == sessionId && x.RevokedUtc == null)
                .ExecuteUpdateAsync(x => x.SetProperty(p => p.RevokedUtc, (DateTime?)DateTime.UtcNow));

        public Task RevokeAllForUserAsync(int userId, string? exceptSessionId = null) =>
            _db.UserSessions.Where(x => x.UserId == userId && x.RevokedUtc == null && x.Id != exceptSessionId)
                .ExecuteUpdateAsync(x => x.SetProperty(p => p.RevokedUtc, (DateTime?)DateTime.UtcNow));
    }
}

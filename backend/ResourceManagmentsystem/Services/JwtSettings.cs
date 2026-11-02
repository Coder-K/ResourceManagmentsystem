namespace ResourceManagmentsystem.Services
{
    public class JwtSettings
    {
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
        /// <summary>A session with no authenticated request for this long is dead.</summary>
        public int IdleTimeoutMinutes { get; set; } = 60;
        /// <summary>Hard cap: even a constantly-used token cannot live longer than this.</summary>
        public int AbsoluteLifetimeHours { get; set; } = 8;
    }
}

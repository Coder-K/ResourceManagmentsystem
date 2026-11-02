using System.Text.Json.Serialization;

namespace ResourceManagmentsystem.Models
{
    /// <summary>
    /// Stored in the existing Users.AccessLevel INTEGER column, so the database layout does not change.
    /// Sent to the front end as a number (0, 1, 2), exactly like before.
    /// </summary>
    public enum AccessLevel
    {
        Normal = 0,
        Manager = 1,
        Admin = 2
    }

    /// <summary>Stored as an integer, sent to the front end as text ("Active", "OnHold", ...).</summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ProjectStatus
    {
        Planning = 0,
        Active = 1,
        OnHold = 2,
        Completed = 3
    }
}

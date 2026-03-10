namespace TestAspire.Server.Models;

public class Guest
{
    public int Id { get; set; }
    public required string FullName { get; set; }
    public string? Phone { get; set; }
    public required string Gender { get; set; } // "male" | "female"

    public ICollection<InvitationGuest> InvitationGuests { get; set; } = [];
}

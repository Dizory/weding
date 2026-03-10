namespace TestAspire.Server.Models;

public class InvitationGuest
{
    public int InvitationId { get; set; }
    public int GuestId { get; set; }
    public int SortOrder { get; set; }

    public Invitation Invitation { get; set; } = null!;
    public Guest Guest { get; set; } = null!;
}

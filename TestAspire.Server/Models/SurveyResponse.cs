namespace TestAspire.Server.Models;

public class SurveyResponse
{
    public int Id { get; set; }
    public int InvitationId { get; set; }
    public int SurveyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Invitation Invitation { get; set; } = null!;
    public Survey Survey { get; set; } = null!;
    public ICollection<SurveyResponseAnswer> Answers { get; set; } = [];
}

namespace TestAspire.Server.Models;

public class SurveyQuestionOption
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public required string Text { get; set; }
    public int SortOrder { get; set; }

    public SurveyQuestion Question { get; set; } = null!;
}

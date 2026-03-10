namespace TestAspire.Server.Models;

public class SurveyResponseAnswer
{
    public int Id { get; set; }
    public int ResponseId { get; set; }
    public int QuestionId { get; set; }
    public int OptionId { get; set; }

    public SurveyResponse Response { get; set; } = null!;
    public SurveyQuestion Question { get; set; } = null!;
    public SurveyQuestionOption Option { get; set; } = null!;
}

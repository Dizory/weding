namespace TestAspire.Server.Models;

/// <summary>single — выбрать один вариант, multiple — отметить несколько</summary>
public class SurveyQuestion
{
    public int Id { get; set; }
    public int SurveyId { get; set; }
    public required string Text { get; set; }
    public required string ChoiceType { get; set; } // "single" | "multiple"
    public int SortOrder { get; set; }

    public Survey Survey { get; set; } = null!;
    public ICollection<SurveyQuestionOption> Options { get; set; } = [];
}

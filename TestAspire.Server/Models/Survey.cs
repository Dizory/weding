namespace TestAspire.Server.Models;

public class Survey
{
    public int Id { get; set; }
    public required string Title { get; set; }
    /// <summary>Отображать заголовок опроса на странице приглашения (по умолчанию false).</summary>
    public bool ShowTitle { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SurveyQuestion> Questions { get; set; } = [];
}

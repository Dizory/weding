namespace TestAspire.Server.Models;

public class Invitation
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public required string BodyTemplate { get; set; }
    /// <summary>Слово обращения: Дорогой / Дорогая / Дорогие. Если пусто — авто по полу и количеству гостей.</summary>
    public string? GreetingWord { get; set; }
    /// <summary>Имена гостей для подстановки. Если пусто — авто из списка гостей приглашения.</summary>
    public string? GuestNames { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>Когда гости подтвердили присутствие (нажали «Подтвердить» на странице приглашения).</summary>
    public DateTime? ConfirmedAt { get; set; }
    /// <summary>Сколько раз отменили подтверждение (отказались после того как подтвердили).</summary>
    public int DeclinedCount { get; set; }

    public ICollection<InvitationGuest> InvitationGuests { get; set; } = [];
    public ICollection<SurveyResponse> SurveyResponses { get; set; } = [];
}

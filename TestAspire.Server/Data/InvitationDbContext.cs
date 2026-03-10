using Microsoft.EntityFrameworkCore;
using TestAspire.Server.Models;

namespace TestAspire.Server.Data;

public class InvitationDbContext : DbContext
{
    public InvitationDbContext(DbContextOptions<InvitationDbContext> options)
        : base(options) { }

    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<InvitationGuest> InvitationGuests => Set<InvitationGuest>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyQuestion> SurveyQuestions => Set<SurveyQuestion>();
    public DbSet<SurveyQuestionOption> SurveyQuestionOptions => Set<SurveyQuestionOption>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();
    public DbSet<SurveyResponseAnswer> SurveyResponseAnswers => Set<SurveyResponseAnswer>();
    public DbSet<Admin> Admins => Set<Admin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Invitation>(e =>
        {
            e.HasIndex(i => i.Slug).IsUnique();
        });

        modelBuilder.Entity<InvitationGuest>(e =>
        {
            e.HasKey(ig => new { ig.InvitationId, ig.GuestId });
            e.HasOne(ig => ig.Invitation).WithMany(i => i.InvitationGuests).HasForeignKey(ig => ig.InvitationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ig => ig.Guest).WithMany(g => g.InvitationGuests).HasForeignKey(ig => ig.GuestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SurveyQuestion>(e =>
        {
            e.HasOne(q => q.Survey).WithMany(s => s.Questions).HasForeignKey(q => q.SurveyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SurveyQuestionOption>(e =>
        {
            e.HasOne(o => o.Question).WithMany(q => q.Options).HasForeignKey(o => o.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SurveyResponse>(e =>
        {
            e.HasOne(r => r.Invitation).WithMany(i => i.SurveyResponses).HasForeignKey(r => r.InvitationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Survey).WithMany().HasForeignKey(r => r.SurveyId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SurveyResponseAnswer>(e =>
        {
            e.HasOne(a => a.Response).WithMany(r => r.Answers).HasForeignKey(a => a.ResponseId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Question).WithMany().HasForeignKey(a => a.QuestionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Option).WithMany().HasForeignKey(a => a.OptionId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}

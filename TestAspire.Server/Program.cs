using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TestAspire.Server.Data;
using TestAspire.Server.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();
builder.AddRedisClientBuilder("cache")
    .WithOutputCache();

// Add services to the container.
builder.Services.AddProblemDetails();
builder.AddSqliteDbContext<InvitationDbContext>("invitations");

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// JWT Auth для CRM
var jwtKey = builder.Configuration["Crm:JwtSecret"] ?? "TestAspire-Crm-Jwt-Secret-Key-Min32Chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseOutputCache();

string[] summaries = ["Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"];

var api = app.MapGroup("/api");
api.MapGet("weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.CacheOutput(p => p.Expire(TimeSpan.FromSeconds(5)))
.WithName("GetWeatherForecast");

app.MapDefaultEndpoints();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InvitationDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    db.Database.Migrate();
    if (!db.Invitations.Any())
    {
        var inv = new Invitation { Slug = "test", Title = "Дмитрий и Ксения", BodyTemplate = "{greeting} {guests}!\n\nПриглашаем вас на нашу свадьбу.", GreetingWord = "Дорогие", GuestNames = "гости" };
        db.Invitations.Add(inv);
        db.SaveChanges();
    }
    var defaultLogin = config["Crm:DefaultAdminLogin"];
    var defaultPassword = config["Crm:DefaultAdminPassword"];
    if (!string.IsNullOrEmpty(defaultLogin) && !string.IsNullOrEmpty(defaultPassword) && !db.Admins.Any(a => a.Login == defaultLogin))
    {
        db.Admins.Add(new Admin { Login = defaultLogin, PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword) });
        db.SaveChanges();
    }
}

static string BuildGreetingWord(List<(string FullName, string Gender)> guests)
{
    if (guests.Count == 0) return "Дорогие";
    if (guests.Count == 1) return guests[0].Gender == "male" ? "Дорогой" : "Дорогая";
    return "Дорогие";
}

static string GenerateSlug() => Guid.NewGuid().ToString("N")[..10];

static string SlugFromTitle(string title)
{
    if (string.IsNullOrWhiteSpace(title)) return GenerateSlug();
    var map = new Dictionary<char, string> {
        ['а']="a",['б']="b",['в']="v",['г']="g",['д']="d",['е']="e",['ё']="e",['ж']="zh",['з']="z",
        ['и']="i",['й']="y",['к']="k",['л']="l",['м']="m",['н']="n",['о']="o",['п']="p",['р']="r",
        ['с']="s",['т']="t",['у']="u",['ф']="f",['х']="h",['ц']="ts",['ч']="ch",['ш']="sh",['щ']="sch",
        ['ъ']="",['ы']="y",['ь']="",['э']="e",['ю']="yu",['я']="ya"
    };
    var sb = new System.Text.StringBuilder();
    foreach (var c in title.Trim().ToLowerInvariant())
    {
        if (map.TryGetValue(c, out var s)) sb.Append(s);
        else if (char.IsAsciiLetter(c) || char.IsDigit(c)) sb.Append(c);
        else if (c == ' ' || c == '-' || c == '_') sb.Append('-');
    }
    var result = System.Text.RegularExpressions.Regex.Replace(sb.ToString(), "-+", "-").Trim('-');
    return string.IsNullOrEmpty(result) ? GenerateSlug() : result[..Math.Min(result.Length, 50)];
}

static string BuildGuestNames(List<(string FullName, string Gender)> guests)
{
    if (guests.Count == 0) return "гости";
    var ordered = guests.OrderBy(g => g.Gender == "male" ? 0 : 1).Select(g => g.FullName).ToList();
    if (ordered.Count == 1) return ordered[0];
    return ordered.Count == 2 ? $"{ordered[0]} и {ordered[1]}" : string.Join(", ", ordered.Take(ordered.Count - 1)) + " и " + ordered[^1];
}

// Auth — логин по учётным данным из конфига или БД
var auth = app.MapGroup("/api/auth");
auth.MapPost("/login", async (LoginRequest req, InvitationDbContext db, IConfiguration config) =>
{
    var login = (req.Login ?? "").Trim();
    var password = req.Password ?? "";
    if (string.IsNullOrEmpty(login)) return Results.BadRequest(new { error = "Логин обязателен" });

    var defaultLogin = config["Crm:DefaultAdminLogin"];
    var defaultPassword = config["Crm:DefaultAdminPassword"];
    string? loginName = null;
    if (!string.IsNullOrEmpty(defaultLogin) && !string.IsNullOrEmpty(defaultPassword) && login == defaultLogin && password == defaultPassword)
        loginName = defaultLogin;
    else
    {
        var admin = await db.Admins.FirstOrDefaultAsync(a => a.Login == login);
        if (admin != null && BCrypt.Net.BCrypt.Verify(password, admin.PasswordHash))
            loginName = admin.Login;
    }
    if (loginName is null) return Results.Unauthorized();

    var jwtKey = config["Crm:JwtSecret"] ?? "TestAspire-Crm-Jwt-Secret-Key-Min32Chars!!";
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
        claims: [new Claim(ClaimTypes.Name, loginName)],
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: creds);
    var tokenString = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
    return Results.Ok(new { token = tokenString });
});
auth.MapGet("/me", (ClaimsPrincipal user) =>
{
    if (user?.Identity?.IsAuthenticated != true) return Results.Unauthorized();
    return Results.Ok(new { login = user.Identity.Name });
}).RequireAuthorization();
auth.MapPut("/me", async (UpdateMyCredentialsRequest req, ClaimsPrincipal user, InvitationDbContext db, IConfiguration config) =>
{
    if (user?.Identity?.IsAuthenticated != true) return Results.Unauthorized();
    var login = user.Identity?.Name;
    if (string.IsNullOrEmpty(login)) return Results.Unauthorized();

    var currentPassword = req.CurrentPassword ?? "";
    var newLogin = string.IsNullOrWhiteSpace(req.NewLogin) ? null : req.NewLogin.Trim();
    var newPassword = req.NewPassword ?? "";

    if (string.IsNullOrEmpty(currentPassword)) return Results.BadRequest(new { error = "Текущий пароль обязателен" });
    if (newLogin is null && string.IsNullOrEmpty(newPassword)) return Results.BadRequest(new { error = "Укажите новый логин или пароль" });
    if (newPassword.Length > 0 && newPassword.Length < 6) return Results.BadRequest(new { error = "Пароль не менее 6 символов" });

    var defaultLogin = config["Crm:DefaultAdminLogin"];
    var defaultPassword = config["Crm:DefaultAdminPassword"];
    var admin = await db.Admins.FirstOrDefaultAsync(a => a.Login == login);

    var currentPasswordValid = false;
    if (!string.IsNullOrEmpty(defaultLogin) && !string.IsNullOrEmpty(defaultPassword) && login == defaultLogin && currentPassword == defaultPassword)
        currentPasswordValid = true;
    else if (admin != null && BCrypt.Net.BCrypt.Verify(currentPassword, admin.PasswordHash))
        currentPasswordValid = true;

    if (!currentPasswordValid) return Results.Unauthorized();

    if (admin is null)
    {
        admin = new Admin { Login = login, PasswordHash = BCrypt.Net.BCrypt.HashPassword(currentPassword) };
        db.Admins.Add(admin);
        await db.SaveChangesAsync();
    }

    if (newLogin != null && newLogin != admin.Login)
    {
        if (await db.Admins.AnyAsync(a => a.Login == newLogin)) return Results.Conflict(new { error = "Логин уже занят" });
        admin.Login = newLogin;
    }
    if (newPassword.Length >= 6)
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

    await db.SaveChangesAsync();
    return Results.Ok(new { login = admin.Login });
}).RequireAuthorization();

var invitations = app.MapGroup("/api/invitations");

invitations.MapGet("/", async (InvitationDbContext db) =>
{
    var list = await db.Invitations
        .Include(i => i.InvitationGuests.OrderBy(ig => ig.SortOrder))
        .ThenInclude(ig => ig.Guest)
        .Include(i => i.SurveyResponses)
        .ThenInclude(sr => sr.Survey)
        .Include(i => i.SurveyResponses)
        .ThenInclude(sr => sr.Answers)
        .ThenInclude(a => a.Question)
        .Include(i => i.SurveyResponses)
        .ThenInclude(sr => sr.Answers)
        .ThenInclude(a => a.Option)
        .OrderByDescending(i => i.CreatedAt)
        .ToListAsync();
    return list.Select(i => new InvitationDto(
        i.Id, i.Slug, i.Title, i.BodyTemplate, i.GreetingWord, i.GuestNames, i.CreatedAt, i.ConfirmedAt,
        i.InvitationGuests.OrderBy(ig => ig.SortOrder).Select(ig => new InvitationGuestDto(ig.Guest.Id, ig.Guest.FullName, ig.Guest.Phone, ig.Guest.Gender, ig.SortOrder)).ToList(),
        i.SurveyResponses.Select(sr => new SurveyResponseDto(sr.SurveyId, sr.Survey.Title, sr.CreatedAt,
            sr.Answers.GroupBy(a => a.QuestionId).Select(g =>
            {
                var first = g.First();
                return new ResponseItemDto(first.Question.Text, g.Select(a => a.Option.Text).ToList());
            }).ToList())).ToList()
    )).ToList();
}).RequireAuthorization();

invitations.MapGet("/{slug}", async (string slug, InvitationDbContext db) =>
{
    var inv = await db.Invitations
        .Include(i => i.InvitationGuests.OrderBy(ig => ig.SortOrder))
        .ThenInclude(ig => ig.Guest)
        .FirstOrDefaultAsync(i => i.Slug == slug);
    if (inv is null) return Results.NotFound();
    var orderedGuests = inv.InvitationGuests.OrderBy(ig => ig.SortOrder).Select(ig => (ig.Guest.FullName, ig.Guest.Gender)).ToList();
    var greetingWord = !string.IsNullOrWhiteSpace(inv.GreetingWord) ? inv.GreetingWord : BuildGreetingWord(orderedGuests);
    var guestNames = !string.IsNullOrWhiteSpace(inv.GuestNames) ? inv.GuestNames : BuildGuestNames(orderedGuests);
    var bodyWithGuests = inv.BodyTemplate
        .Replace("{greeting}", greetingWord)
        .Replace("{guests}", guestNames);
    return Results.Ok(new { inv.Id, inv.Slug, inv.Title, inv.BodyTemplate, BodyWithGuests = bodyWithGuests, GuestNames = guestNames, GreetingWord = greetingWord, ConfirmedAt = inv.ConfirmedAt });
});

invitations.MapPost("/", async (CreateInvitationRequest req, InvitationDbContext db) =>
{
    var slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug.Trim().ToLowerInvariant() : SlugFromTitle(req.Title);
    var baseSlug = slug;
    var n = 0;
    while (await db.Invitations.AnyAsync(i => i.Slug == slug))
        slug = $"{baseSlug}-{++n}";
    var inv = new Invitation
    {
        Slug = slug,
        Title = req.Title,
        BodyTemplate = req.BodyTemplate,
        GreetingWord = req.GreetingWord,
        GuestNames = req.GuestNames
    };
    db.Invitations.Add(inv);
    await db.SaveChangesAsync();
    return Results.Created($"/api/invitations/{inv.Slug}", new InvitationDto(inv.Id, inv.Slug, inv.Title, inv.BodyTemplate, inv.GreetingWord, inv.GuestNames, inv.CreatedAt, inv.ConfirmedAt, [], []));
}).RequireAuthorization();

invitations.MapPut("/{id:int}", async (int id, UpdateInvitationRequest req, InvitationDbContext db) =>
{
    var inv = await db.Invitations.FindAsync(id);
    if (inv is null) return Results.NotFound();
    inv.Title = req.Title;
    inv.BodyTemplate = req.BodyTemplate;
    inv.GreetingWord = req.GreetingWord;
    inv.GuestNames = req.GuestNames;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

invitations.MapDelete("/{id:int}", async (int id, InvitationDbContext db) =>
{
    var inv = await db.Invitations.FindAsync(id);
    if (inv is null) return Results.NotFound();
    db.Invitations.Remove(inv);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

invitations.MapPost("/{id:int}/guests", async (int id, AddGuestToInvitationRequest req, InvitationDbContext db) =>
{
    var inv = await db.Invitations.FindAsync(id);
    if (inv is null) return Results.NotFound();
    if (!req.GuestId.HasValue && string.IsNullOrWhiteSpace(req.FullName))
        return Results.BadRequest(new { error = "Either GuestId or FullName is required" });
    if (req.GuestId.HasValue && await db.InvitationGuests.AnyAsync(ig => ig.InvitationId == id && ig.GuestId == req.GuestId.Value))
        return Results.Conflict(new { error = "Guest already in invitation" });
    Guest guest;
    if (req.GuestId.HasValue)
    {
        guest = await db.Guests.FindAsync(req.GuestId!.Value);
        if (guest is null) return Results.NotFound();
    }
    else
    {
        guest = new Guest { FullName = req.FullName!.Trim(), Phone = req.Phone, Gender = req.Gender };
        db.Guests.Add(guest);
        await db.SaveChangesAsync();
    }
    var maxOrder = await db.InvitationGuests.Where(ig => ig.InvitationId == id).MaxAsync(ig => (int?)ig.SortOrder) ?? -1;
    db.InvitationGuests.Add(new InvitationGuest { InvitationId = id, GuestId = guest.Id, SortOrder = maxOrder + 1 });
    await db.SaveChangesAsync();
    return Results.Created($"/api/invitations/{id}/guests/{guest.Id}",
        new InvitationGuestDto(guest.Id, guest.FullName, guest.Phone, guest.Gender, maxOrder + 1));
}).RequireAuthorization();

invitations.MapDelete("/{invId:int}/guests/{guestId:int}", async (int invId, int guestId, InvitationDbContext db) =>
{
    var ig = await db.InvitationGuests.FirstOrDefaultAsync(x => x.InvitationId == invId && x.GuestId == guestId);
    if (ig is null) return Results.NotFound();
    db.InvitationGuests.Remove(ig);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

invitations.MapPost("/{slug}/confirm", async (string slug, InvitationDbContext db) =>
{
    var inv = await db.Invitations.FirstOrDefaultAsync(i => i.Slug == slug);
    if (inv is null) return Results.NotFound();
    if (inv.ConfirmedAt.HasValue) return Results.Ok(new { confirmedAt = inv.ConfirmedAt });
    inv.ConfirmedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { confirmedAt = inv.ConfirmedAt });
});

invitations.MapDelete("/{slug}/confirm", async (string slug, InvitationDbContext db) =>
{
    var inv = await db.Invitations.FirstOrDefaultAsync(i => i.Slug == slug);
    if (inv is null) return Results.NotFound();
    if (inv.ConfirmedAt.HasValue) inv.DeclinedCount++;
    inv.ConfirmedAt = null;
    await db.SaveChangesAsync();
    return Results.Ok(new { confirmedAt = (DateTime?)null });
});

invitations.MapPost("/{slug}/survey-responses", async (string slug, SubmitSurveyResponseRequest req, InvitationDbContext db) =>
{
    var inv = await db.Invitations.FirstOrDefaultAsync(i => i.Slug == slug);
    if (inv is null) return Results.NotFound();
    if (await db.Surveys.FindAsync(req.SurveyId) is null) return Results.NotFound();
    var existing = await db.SurveyResponses.FirstOrDefaultAsync(r => r.InvitationId == inv.Id && r.SurveyId == req.SurveyId);
    if (existing is not null)
    {
        db.SurveyResponses.Remove(existing);
        await db.SaveChangesAsync();
    }
    var response = new SurveyResponse { InvitationId = inv.Id, SurveyId = req.SurveyId };
    db.SurveyResponses.Add(response);
    await db.SaveChangesAsync();
    foreach (var a in req.Answers)
    {
        if (a.OptionIds.Count == 0) continue;
        var question = await db.SurveyQuestions.FindAsync(a.QuestionId);
        if (question is null || question.SurveyId != req.SurveyId) continue;
        foreach (var optId in a.OptionIds)
        {
            var opt = await db.SurveyQuestionOptions.FindAsync(optId);
            if (opt is null || opt.QuestionId != a.QuestionId) continue;
            db.SurveyResponseAnswers.Add(new SurveyResponseAnswer { ResponseId = response.Id, QuestionId = a.QuestionId, OptionId = optId });
        }
    }
    await db.SaveChangesAsync();
    return Results.Created($"/api/invitations/{slug}/survey-responses/{response.Id}", new { id = response.Id });
});

var guests = app.MapGroup("/api/guests").RequireAuthorization();
guests.MapGet("/", async (InvitationDbContext db) =>
    await db.Guests
        .OrderBy(g => g.FullName)
        .Select(g => new GuestListItemDto(g.Id, g.FullName, g.Phone, g.Gender))
        .ToListAsync());
guests.MapPost("/", async (CreateGuestRequest req, InvitationDbContext db) =>
{
    var guest = new Guest { FullName = req.FullName.Trim(), Phone = req.Phone, Gender = req.Gender };
    db.Guests.Add(guest);
    await db.SaveChangesAsync();
    return Results.Created($"/api/guests/{guest.Id}", new GuestListItemDto(guest.Id, guest.FullName, guest.Phone, guest.Gender));
});
guests.MapPut("/{id:int}", async (int id, UpdateGuestRequest req, InvitationDbContext db) =>
{
    var guest = await db.Guests.FindAsync(id);
    if (guest is null) return Results.NotFound();
    guest.FullName = req.FullName.Trim();
    guest.Phone = req.Phone;
    guest.Gender = req.Gender;
    await db.SaveChangesAsync();
    return Results.Ok(new GuestListItemDto(guest.Id, guest.FullName, guest.Phone, guest.Gender));
});

var surveys = app.MapGroup("/api/surveys");
surveys.MapGet("/", async (InvitationDbContext db) =>
    await db.Surveys
        .Include(s => s.Questions.OrderBy(q => q.SortOrder))
        .ThenInclude(q => q.Options.OrderBy(o => o.SortOrder))
        .OrderByDescending(s => s.CreatedAt)
        .Select(s => new SurveyDto(s.Id, s.Title, s.ShowTitle, s.CreatedAt,
            s.Questions.OrderBy(q => q.SortOrder).Select(q => new SurveyQuestionDto(q.Id, q.Text, q.ChoiceType, q.SortOrder,
                q.Options.OrderBy(o => o.SortOrder).Select(o => new SurveyQuestionOptionDto(o.Id, o.Text, o.SortOrder)).ToList())).ToList()))
        .ToListAsync());

surveys.MapGet("/{id:int}", async (int id, InvitationDbContext db) =>
{
    var s = await db.Surveys
        .Include(s => s.Questions.OrderBy(q => q.SortOrder))
        .ThenInclude(q => q.Options.OrderBy(o => o.SortOrder))
        .FirstOrDefaultAsync(s => s.Id == id);
    if (s is null) return Results.NotFound();
    return Results.Ok(new SurveyDto(s.Id, s.Title, s.ShowTitle, s.CreatedAt,
        s.Questions.OrderBy(q => q.SortOrder).Select(q => new SurveyQuestionDto(q.Id, q.Text, q.ChoiceType, q.SortOrder,
            q.Options.OrderBy(o => o.SortOrder).Select(o => new SurveyQuestionOptionDto(o.Id, o.Text, o.SortOrder)).ToList())).ToList()));
}).RequireAuthorization();

surveys.MapPost("/", async (CreateSurveyRequest req, InvitationDbContext db) =>
{
    var survey = new Survey { Title = req.Title.Trim(), ShowTitle = req.ShowTitle };
    db.Surveys.Add(survey);
    await db.SaveChangesAsync();
    return Results.Created($"/api/surveys/{survey.Id}", new SurveyDto(survey.Id, survey.Title, survey.ShowTitle, survey.CreatedAt, []));
}).RequireAuthorization();

surveys.MapPut("/{id:int}", async (int id, UpdateSurveyRequest req, InvitationDbContext db) =>
{
    var s = await db.Surveys.FindAsync(id);
    if (s is null) return Results.NotFound();
    s.Title = req.Title.Trim();
    s.ShowTitle = req.ShowTitle;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

surveys.MapDelete("/{id:int}", async (int id, InvitationDbContext db) =>
{
    var s = await db.Surveys.FindAsync(id);
    if (s is null) return Results.NotFound();
    db.Surveys.Remove(s);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

surveys.MapPost("/{surveyId:int}/questions", async (int surveyId, CreateQuestionRequest req, InvitationDbContext db) =>
{
    if (await db.Surveys.FindAsync(surveyId) is null) return Results.NotFound();
    var choiceType = req.ChoiceType is "single" or "multiple" ? req.ChoiceType : "single";
    var maxOrder = await db.SurveyQuestions.Where(q => q.SurveyId == surveyId).MaxAsync(q => (int?)q.SortOrder) ?? -1;
    var q = new SurveyQuestion { SurveyId = surveyId, Text = req.Text.Trim(), ChoiceType = choiceType, SortOrder = maxOrder + 1 };
    db.SurveyQuestions.Add(q);
    await db.SaveChangesAsync();
    return Results.Created($"/api/surveys/{surveyId}/questions/{q.Id}",
        new SurveyQuestionDto(q.Id, q.Text, q.ChoiceType, q.SortOrder, []));
}).RequireAuthorization();

surveys.MapPut("/{surveyId:int}/questions/{questionId:int}", async (int surveyId, int questionId, UpdateQuestionRequest req, InvitationDbContext db) =>
{
    var q = await db.SurveyQuestions.FirstOrDefaultAsync(x => x.SurveyId == surveyId && x.Id == questionId);
    if (q is null) return Results.NotFound();
    var choiceType = req.ChoiceType is "single" or "multiple" ? req.ChoiceType : q.ChoiceType;
    q.Text = req.Text.Trim();
    q.ChoiceType = choiceType;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

surveys.MapDelete("/{surveyId:int}/questions/{questionId:int}", async (int surveyId, int questionId, InvitationDbContext db) =>
{
    var q = await db.SurveyQuestions.FirstOrDefaultAsync(x => x.SurveyId == surveyId && x.Id == questionId);
    if (q is null) return Results.NotFound();
    db.SurveyQuestions.Remove(q);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

surveys.MapPost("/{surveyId:int}/questions/{questionId:int}/options", async (int surveyId, int questionId, CreateOptionRequest req, InvitationDbContext db) =>
{
    var q = await db.SurveyQuestions.FirstOrDefaultAsync(x => x.SurveyId == surveyId && x.Id == questionId);
    if (q is null) return Results.NotFound();
    var maxOrder = await db.SurveyQuestionOptions.Where(o => o.QuestionId == questionId).MaxAsync(o => (int?)o.SortOrder) ?? -1;
    var o = new SurveyQuestionOption { QuestionId = questionId, Text = req.Text.Trim(), SortOrder = maxOrder + 1 };
    db.SurveyQuestionOptions.Add(o);
    await db.SaveChangesAsync();
    return Results.Created($"/api/surveys/{surveyId}/questions/{questionId}/options/{o.Id}",
        new SurveyQuestionOptionDto(o.Id, o.Text, o.SortOrder));
}).RequireAuthorization();

surveys.MapPut("/{surveyId:int}/questions/{questionId:int}/options/{optionId:int}", async (int surveyId, int questionId, int optionId, UpdateOptionRequest req, InvitationDbContext db) =>
{
    var o = await db.SurveyQuestionOptions
        .Join(db.SurveyQuestions, opt => opt.QuestionId, q => q.Id, (opt, q) => new { opt, q })
        .Where(x => x.q.SurveyId == surveyId && x.q.Id == questionId && x.opt.Id == optionId)
        .Select(x => x.opt)
        .FirstOrDefaultAsync();
    if (o is null) return Results.NotFound();
    o.Text = req.Text.Trim();
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

surveys.MapDelete("/{surveyId:int}/questions/{questionId:int}/options/{optionId:int}", async (int surveyId, int questionId, int optionId, InvitationDbContext db) =>
{
    var o = await db.SurveyQuestionOptions
        .Join(db.SurveyQuestions, opt => opt.QuestionId, q => q.Id, (opt, q) => new { opt, q })
        .Where(x => x.q.SurveyId == surveyId && x.q.Id == questionId && x.opt.Id == optionId)
        .Select(x => x.opt)
        .FirstOrDefaultAsync();
    if (o is null) return Results.NotFound();
    db.SurveyQuestionOptions.Remove(o);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

var admins = app.MapGroup("/api/admins").RequireAuthorization();
admins.MapGet("/", async (InvitationDbContext db) =>
    await db.Admins
        .OrderBy(a => a.Login)
        .Select(a => new { a.Id, a.Login, a.CreatedAt })
        .ToListAsync());
admins.MapPost("/", async (CreateAdminRequest req, InvitationDbContext db) =>
{
    var login = (req.Login ?? "").Trim();
    var password = req.Password ?? "";
    if (string.IsNullOrEmpty(login)) return Results.BadRequest(new { error = "Логин обязателен" });
    if (password.Length < 6) return Results.BadRequest(new { error = "Пароль не менее 6 символов" });
    if (await db.Admins.AnyAsync(a => a.Login == login)) return Results.Conflict(new { error = "Логин уже существует" });
    var admin = new Admin { Login = login, PasswordHash = BCrypt.Net.BCrypt.HashPassword(password) };
    db.Admins.Add(admin);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admins/{admin.Id}", new { admin.Id, admin.Login, admin.CreatedAt });
});
admins.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, InvitationDbContext db) =>
{
    var admin = await db.Admins.FindAsync(id);
    if (admin is null) return Results.NotFound();
    if (user.Identity?.Name == admin.Login) return Results.BadRequest(new { error = "Нельзя удалить свой аккаунт" });
    db.Admins.Remove(admin);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

var stats = app.MapGroup("/api/stats").RequireAuthorization();
stats.MapGet("/", async (InvitationDbContext db) =>
{
    var totalGuests = await db.Guests.CountAsync();
    var totalInvitations = await db.Invitations.CountAsync();
    var confirmedGuestCount = await db.InvitationGuests.Include(ig => ig.Invitation).CountAsync(ig => ig.Invitation.ConfirmedAt != null);
    var totalGuestSlots = await db.InvitationGuests.CountAsync();
    var totalDeclined = await db.Invitations.SumAsync(i => i.DeclinedCount);
    var answers = await db.SurveyResponseAnswers
        .Include(a => a.Option)
        .Include(a => a.Question)
        .ThenInclude(q => q.Survey)
        .ToListAsync();
    var bySurvey = answers
        .GroupBy(a => a.Question.Survey.Title)
        .Select(surveyG => new
        {
            SurveyTitle = surveyG.Key,
            Questions = surveyG
                .GroupBy(a => a.Question.Text)
                .Select(qG => new
                {
                    QuestionText = qG.Key,
                    Options = qG
                        .GroupBy(a => a.Option.Text)
                        .Select(oG => new { OptionText = oG.Key, Count = oG.Count() })
                        .ToList()
                })
                .ToList()
        })
        .ToList();
    return Results.Ok(new
    {
        TotalGuests = totalGuests,
        TotalInvitations = totalInvitations,
        ConfirmedGuests = confirmedGuestCount,
        TotalGuestSlots = totalGuestSlots,
        DeclinedCount = totalDeclined,
        SurveyAnswers = bySurvey
    });
});

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name == "index.html")
            ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
    }
});
app.Use(async (context, next) =>
{
    await next();
    if (context.Response.ContentType?.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) == true)
        context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
});
app.MapFallbackToFile("index.html");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

record InvitationDto(int Id, string Slug, string Title, string BodyTemplate, string? GreetingWord, string? GuestNames, DateTime CreatedAt, DateTime? ConfirmedAt, List<InvitationGuestDto> Guests, List<SurveyResponseDto> SurveyResponses);
record SurveyResponseDto(int SurveyId, string SurveyTitle, DateTime CreatedAt, List<ResponseItemDto> Items);
record ResponseItemDto(string QuestionText, List<string> SelectedOptions);
record InvitationGuestDto(int Id, string Name, string? Phone, string Gender, int SortOrder);
record GuestListItemDto(int Id, string FullName, string? Phone, string Gender);
record CreateInvitationRequest(string? Slug, string Title, string BodyTemplate, string? GreetingWord, string? GuestNames);
record UpdateInvitationRequest(string Title, string BodyTemplate, string? GreetingWord, string? GuestNames);
record UpdateGuestRequest(string FullName, string? Phone, string Gender);
record AddGuestToInvitationRequest(int? GuestId, string? FullName, string? Phone, string Gender);
record CreateGuestRequest(string FullName, string? Phone, string Gender);
record SurveyDto(int Id, string Title, bool ShowTitle, DateTime CreatedAt, List<SurveyQuestionDto> Questions);
record SurveyQuestionDto(int Id, string Text, string ChoiceType, int SortOrder, List<SurveyQuestionOptionDto> Options);
record SurveyQuestionOptionDto(int Id, string Text, int SortOrder);
record CreateSurveyRequest(string Title, bool ShowTitle = false);
record UpdateSurveyRequest(string Title, bool ShowTitle);
record CreateQuestionRequest(string Text, string ChoiceType);
record UpdateQuestionRequest(string Text, string ChoiceType);
record CreateOptionRequest(string Text);
record UpdateOptionRequest(string Text);
record LoginRequest(string? Login, string? Password);
record CreateAdminRequest(string? Login, string? Password);
record UpdateMyCredentialsRequest(string? CurrentPassword, string? NewLogin, string? NewPassword);
record SubmitSurveyResponseRequest(int SurveyId, List<SurveyAnswerItem> Answers);
record SurveyAnswerItem(int QuestionId, List<int> OptionIds);

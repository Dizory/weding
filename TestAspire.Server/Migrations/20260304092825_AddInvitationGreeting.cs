using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestAspire.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitationGreeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Greeting",
                table: "Invitations",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Greeting",
                table: "Invitations");
        }
    }
}

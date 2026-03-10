using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestAspire.Server.Migrations
{
    /// <inheritdoc />
    public partial class SplitGreetingAndGuestNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Greeting",
                table: "Invitations",
                newName: "GreetingWord");

            migrationBuilder.AddColumn<string>(
                name: "GuestNames",
                table: "Invitations",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuestNames",
                table: "Invitations");

            migrationBuilder.RenameColumn(
                name: "GreetingWord",
                table: "Invitations",
                newName: "Greeting");
        }
    }
}

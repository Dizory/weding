using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestAspire.Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEventDateAndPlace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EventDate",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "EventPlace",
                table: "Invitations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EventDate",
                table: "Invitations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EventPlace",
                table: "Invitations",
                type: "TEXT",
                nullable: true);
        }
    }
}

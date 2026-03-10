using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TestAspire.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSurveyShowTitle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowTitle",
                table: "Surveys",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowTitle",
                table: "Surveys");
        }
    }
}

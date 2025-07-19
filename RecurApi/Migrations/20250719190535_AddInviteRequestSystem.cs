using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecurApi.Migrations
{
    /// <inheritdoc />
    public partial class AddInviteRequestSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InviteRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    GeneratedInviteId = table.Column<int>(type: "int", nullable: true),
                    ReviewNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InviteRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InviteRequests_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_InviteRequests_Invites_GeneratedInviteId",
                        column: x => x.GeneratedInviteId,
                        principalTable: "Invites",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_InviteRequest_CreatedAt",
                table: "InviteRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InviteRequest_Email",
                table: "InviteRequests",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_InviteRequest_Status",
                table: "InviteRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InviteRequests_GeneratedInviteId",
                table: "InviteRequests",
                column: "GeneratedInviteId");

            migrationBuilder.CreateIndex(
                name: "IX_InviteRequests_ReviewedByUserId",
                table: "InviteRequests",
                column: "ReviewedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InviteRequests");
        }
    }
}

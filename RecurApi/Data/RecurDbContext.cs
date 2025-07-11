using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RecurApi.Models;

namespace RecurApi.Data;

public class RecurDbContext : IdentityDbContext<User>
{
    public RecurDbContext(DbContextOptions<RecurDbContext> options) : base(options)
    {
    }

    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<UserSettings> UserSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure User relationships and properties
        builder.Entity<User>(entity =>
        {
            entity.HasMany(u => u.Subscriptions)
                  .WithOne(s => s.User)
                  .HasForeignKey(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.Alerts)
                  .WithOne(a => a.User)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(u => u.Settings)
                  .WithOne(s => s.User)
                  .HasForeignKey<UserSettings>(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Configure DateTime properties with database defaults
            entity.Property(u => u.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Configure Subscription relationships and properties
        builder.Entity<Subscription>(entity =>
        {
            entity.HasOne(s => s.Category)
                  .WithMany(c => c.Subscriptions)
                  .HasForeignKey(s => s.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(s => s.Cost)
                  .HasPrecision(10, 2);

            entity.HasIndex(s => new { s.UserId, s.Name })
                  .HasDatabaseName("IX_Subscription_User_Name");

            // Configure DateTime properties with database defaults
            entity.Property(s => s.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
            entity.Property(s => s.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Configure Category properties
        builder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Name)
                  .IsUnique()
                  .HasDatabaseName("IX_Category_Name");

            // Configure DateTime properties with database defaults
            entity.Property(c => c.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Configure Alert properties
        builder.Entity<Alert>(entity =>
        {
            entity.HasIndex(a => new { a.UserId, a.IsRead, a.CreatedAt })
                  .HasDatabaseName("IX_Alert_User_Read_Created");

            // Configure relationship with Subscription to avoid cascade paths
            entity.HasOne(a => a.Subscription)
                  .WithMany(s => s.Alerts)
                  .HasForeignKey(a => a.SubscriptionId)
                  .OnDelete(DeleteBehavior.NoAction);

            // Configure DateTime properties with database defaults
            entity.Property(a => a.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Configure UserSettings properties
        builder.Entity<UserSettings>(entity =>
        {
            entity.HasIndex(s => s.UserId)
                  .IsUnique()
                  .HasDatabaseName("IX_UserSettings_UserId");

            // Configure DateTime properties with database defaults
            entity.Property(s => s.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
            entity.Property(s => s.UpdatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Seed default categories with static CreatedAt values
        SeedDefaultCategories(builder);
    }

    private static void SeedDefaultCategories(ModelBuilder builder)
    {
        var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        
        builder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Entertainment", Description = "Streaming services, games, media", Color = "#e74c3c", IsDefault = true, CreatedAt = seedDate },
            new Category { Id = 2, Name = "Utilities", Description = "Internet, phone, cloud storage", Color = "#3498db", IsDefault = true, CreatedAt = seedDate },
            new Category { Id = 3, Name = "Productivity", Description = "Software tools, business apps", Color = "#2ecc71", IsDefault = true, CreatedAt = seedDate },
            new Category { Id = 4, Name = "Health & Fitness", Description = "Gym memberships, health apps", Color = "#f39c12", IsDefault = true, CreatedAt = seedDate },
            new Category { Id = 5, Name = "News & Education", Description = "Newspapers, learning platforms", Color = "#9b59b6", IsDefault = true, CreatedAt = seedDate },
            new Category { Id = 6, Name = "Other", Description = "Miscellaneous subscriptions", Color = "#95a5a6", IsDefault = true, CreatedAt = seedDate }
        );
    }
} 
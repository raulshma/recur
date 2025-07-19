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
    public DbSet<ExchangeRate> ExchangeRates { get; set; }
    public DbSet<SubscriptionHistory> SubscriptionHistory { get; set; }
    public DbSet<Invite> Invites { get; set; }

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

            // Configure decimal properties with precision
            entity.Property(u => u.BudgetLimit)
                  .HasPrecision(10, 2);

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

        // Configure ExchangeRate properties with performance optimizations
        builder.Entity<ExchangeRate>(entity =>
        {
            entity.Property(e => e.Rate)
                  .HasPrecision(18, 8);

            // Performance optimization: Primary composite index for fast lookups
            entity.HasIndex(e => new { e.FromCurrency, e.ToCurrency, e.ExpiresAt })
                  .HasDatabaseName("IX_ExchangeRate_Currencies_Expiry");

            // Performance optimization: Additional index for cleanup operations
            entity.HasIndex(e => e.ExpiresAt)
                  .HasDatabaseName("IX_ExchangeRate_ExpiresAt");

            // Performance optimization: Index for frequently used pairs analysis
            entity.HasIndex(e => new { e.FromCurrency, e.Timestamp })
                  .HasDatabaseName("IX_ExchangeRate_FromCurrency_Timestamp");

            // Performance optimization: Index for source-based queries
            entity.HasIndex(e => new { e.Source, e.Timestamp })
                  .HasDatabaseName("IX_ExchangeRate_Source_Timestamp");

            // Configure DateTime properties with database defaults
            entity.Property(e => e.Timestamp)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Configure SubscriptionHistory properties
        builder.Entity<SubscriptionHistory>(entity =>
        {
            entity.HasIndex(sh => new { sh.SubscriptionId, sh.Timestamp })
                  .HasDatabaseName("IX_SubscriptionHistory_Subscription_Timestamp");

            entity.HasIndex(sh => new { sh.UserId, sh.Timestamp })
                  .HasDatabaseName("IX_SubscriptionHistory_User_Timestamp");

            // Configure relationship with Subscription
            entity.HasOne(sh => sh.Subscription)
                  .WithMany(s => s.History)
                  .HasForeignKey(sh => sh.SubscriptionId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Configure relationship with User
            entity.HasOne(sh => sh.User)
                  .WithMany()
                  .HasForeignKey(sh => sh.UserId)
                  .OnDelete(DeleteBehavior.NoAction);

            // Configure DateTime properties with database defaults
            entity.Property(sh => sh.Timestamp)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        // Configure Invite entity
        builder.Entity<Invite>(entity =>
        {
            entity.HasKey(i => i.Id);

            entity.Property(i => i.Email)
                  .IsRequired()
                  .HasMaxLength(255);

            entity.Property(i => i.Token)
                  .IsRequired()
                  .HasMaxLength(255);

            entity.Property(i => i.Role)
                  .HasMaxLength(50)
                  .HasDefaultValue("User");

            entity.Property(i => i.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Configure relationship with InvitedBy user
            entity.HasOne(i => i.InvitedBy)
                  .WithMany()
                  .HasForeignKey(i => i.InvitedByUserId)
                  .OnDelete(DeleteBehavior.NoAction);

            // Configure relationship with AcceptedBy user
            entity.HasOne(i => i.AcceptedBy)
                  .WithMany()
                  .HasForeignKey(i => i.AcceptedByUserId)
                  .OnDelete(DeleteBehavior.NoAction);

            // Create unique index for active invites
            entity.HasIndex(i => new { i.Email, i.IsUsed })
                  .HasDatabaseName("IX_Invite_Email_IsUsed");

            entity.HasIndex(i => i.Token)
                  .IsUnique()
                  .HasDatabaseName("IX_Invite_Token");
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
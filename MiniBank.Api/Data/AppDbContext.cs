using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Models;

namespace MiniBank.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        
        modelBuilder.Entity<Account>()
            .HasIndex(a => a.Number)
            .IsUnique();

        modelBuilder.Entity<Account>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Accounts_Balance_NonNegative",
                "\"Balance\" >= 0"));
        
        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.FromAccountId);

        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.ToAccountId);

        modelBuilder.Entity<Transaction>()
            .HasIndex(t => new { t.ToAccountId, t.CreatedAt });
        
        modelBuilder.Entity<Goal>()
            .HasOne(g => g.User)
            .WithMany()
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<Budget> Budgets => Set<Budget>();
}
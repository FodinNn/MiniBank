using Microsoft.EntityFrameworkCore;
using MiniBank.Api.Models;

namespace MiniBank.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        
        var now = DateTime.UtcNow;

        var alice = new User
        {
            Email = "alice@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            FullName = "Алиса Иванова",
            CreatedAt = now.AddDays(-90)
        };

        var bob = new User
        {
            Email = "bob@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            FullName = "Борис Петров",
            CreatedAt = now.AddDays(-60)
        };

        var carol = new User
        {
            Email = "carol@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            FullName = "Каролина Сидорова",
            CreatedAt = now.AddDays(-45)
        };

        db.Users.AddRange(alice, bob, carol);
        await db.SaveChangesAsync();


        var aliceRub = new Account
        {
            Number = "40817810000000000001",
            Balance = 85000m,
            Currency = "RUB",
            UserId = alice.Id,
            CreatedAt = now.AddDays(-90)
        };
        var aliceUsd = new Account
        {
            Number = "40817840000000000002",
            Balance = 1200m,
            Currency = "USD",
            UserId = alice.Id,
            CreatedAt = now.AddDays(-80)
        };
        var aliceEur = new Account
        {
            Number = "40817978000000000003",
            Balance = 750m,
            Currency = "EUR",
            UserId = alice.Id,
            CreatedAt = now.AddDays(-70)
        };

        var bobRub = new Account
        {
            Number = "40817810000000000004",
            Balance = 42000m,
            Currency = "RUB",
            UserId = bob.Id,
            CreatedAt = now.AddDays(-60)
        };
        var bobUsd = new Account
        {
            Number = "40817840000000000005",
            Balance = 350m,
            Currency = "USD",
            UserId = bob.Id,
            CreatedAt = now.AddDays(-55)
        };

        var carolRub = new Account
        {
            Number = "40817810000000000006",
            Balance = 150000m,
            Currency = "RUB",
            UserId = carol.Id,
            CreatedAt = now.AddDays(-45)
        };
        var carolEur = new Account
        {
            Number = "40817978000000000007",
            Balance = 2500m,
            Currency = "EUR",
            UserId = carol.Id,
            CreatedAt = now.AddDays(-40)
        };

        db.Accounts.AddRange(
            aliceRub, aliceUsd, aliceEur,
            bobRub, bobUsd,
            carolRub, carolEur);
        await db.SaveChangesAsync();

        
        var transactions = new List<Transaction>
        {
            // ── Alice: пополнения (зарплата) ──
            Tx(null, aliceRub.Id, 95000m, "RUB", "Зарплата", now.AddDays(-30)),
            Tx(null, aliceRub.Id, 95000m, "RUB", "Зарплата", now.AddDays(0)),
            Tx(null, aliceUsd.Id, 500m, "USD", "Фриланс-проект", now.AddDays(-20)),

            // ── Alice: расходы ──
            Tx(aliceRub.Id, null, 45000m, "RUB", "Аренда квартиры", now.AddDays(-28)),
            Tx(aliceRub.Id, null, 12500m, "RUB", "Продукты", now.AddDays(-25)),
            Tx(aliceRub.Id, null, 3200m, "RUB", "Кофейня", now.AddDays(-22)),
            Tx(aliceRub.Id, null, 8700m, "RUB", "Коммунальные услуги", now.AddDays(-18)),
            Tx(aliceRub.Id, null, 2300m, "RUB", "Такси", now.AddDays(-15)),
            Tx(aliceRub.Id, null, 5600m, "RUB", "Ресторан", now.AddDays(-12)),
            Tx(aliceRub.Id, null, 14000m, "RUB", "Одежда", now.AddDays(-10)),
            Tx(aliceRub.Id, null, 4800m, "RUB", "Продукты", now.AddDays(-7)),
            Tx(aliceRub.Id, null, 1500m, "RUB", "Кино", now.AddDays(-4)),
            Tx(aliceRub.Id, null, 6200m, "RUB", "Продукты", now.AddDays(-2)),
            Tx(aliceRub.Id, null, 890m, "RUB", "Кофейня", now.AddDays(-1)),

            // ── Alice → Bob: переводы ──
            Tx(aliceRub.Id, bobRub.Id, 5000m, "RUB", "Возврат долга", now.AddDays(-21)),
            Tx(aliceRub.Id, bobRub.Id, 1500m, "RUB", "За обед", now.AddDays(-8)),

            // ── Alice → Carol ──
            Tx(aliceRub.Id, carolRub.Id, 3000m, "RUB", "Подарок", now.AddDays(-5)),

            // ── Bob: пополнение ──
            Tx(null, bobRub.Id, 70000m, "RUB", "Зарплата", now.AddDays(-28)),
            Tx(null, bobUsd.Id, 200m, "USD", "Подработка", now.AddDays(-15)),

            // ── Bob: расходы ──
            Tx(bobRub.Id, null, 35000m, "RUB", "Аренда", now.AddDays(-27)),
            Tx(bobRub.Id, null, 9800m, "RUB", "Продукты", now.AddDays(-20)),
            Tx(bobRub.Id, null, 2400m, "RUB", "Кофейня", now.AddDays(-14)),
            Tx(bobRub.Id, null, 6700m, "RUB", "Интернет и связь", now.AddDays(-10)),
            Tx(bobRub.Id, null, 12000m, "RUB", "Спортзал (год)", now.AddDays(-6)),
            Tx(bobRub.Id, null, 3100m, "RUB", "Продукты", now.AddDays(-2)),

            // ── Carol: пополнение ──
            Tx(null, carolRub.Id, 200000m, "RUB", "Продажа авто", now.AddDays(-40)),
            Tx(null, carolEur.Id, 3000m, "EUR", "Наследство", now.AddDays(-35)),

            // ── Carol: расходы ──
            Tx(carolRub.Id, null, 60000m, "RUB", "Ремонт", now.AddDays(-30)),
            Tx(carolRub.Id, null, 15000m, "RUB", "Мебель", now.AddDays(-18)),
            Tx(carolRub.Id, null, 5600m, "RUB", "Продукты", now.AddDays(-9)),
            Tx(carolRub.Id, null, 28000m, "RUB", "Путешествие", now.AddDays(-3)),
        };

        db.Transactions.AddRange(transactions);
        await db.SaveChangesAsync();
    }

    private static Transaction Tx(int? fromId, int? toId, decimal amount, string currency, string description, DateTime createdAt)
    {
        return new Transaction
        {
            FromAccountId = fromId,
            ToAccountId = toId,
            Amount = amount,
            Currency = currency,
            Description = description,
            CreatedAt = createdAt
        };
    }
}
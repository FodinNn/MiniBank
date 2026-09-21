# MiniBank

Мини-банк на .NET 10 — REST API для счетов, переводов и истории транзакций.
Учебный проект: JWT-аутентификация, PostgreSQL через EF Core, транзакции БД.

## Стек

| Слой           | Технология               |
| -------------- | ------------------------ |
| Платформа      | .NET 10                  |
| API            | ASP.NET Core Minimal API |
| ORM            | EF Core 10 + Npgsql      |
| БД             | PostgreSQL 16            |
| Аутентификация | JWT (HS256)              |
| Пароли         | BCrypt.Net-Next          |
| Документация   | OpenAPI + Scalar         |

## Возможности

- Регистрация и вход по JWT
- Создание счетов в RUB / USD / EUR
- Пополнение счёта
- Переводы между счетами с проверкой баланса и валюты
- История транзакций - только свои
- Курсы валют
- Защита от IDOR и race condition

## Архитектура

```
MiniBank.Api/
├── Data/           AppDbContext
├── DTOs/           модели запросов и ответов (record)
├── Endpoints/      Minimal API endpoints
├── Extensions/     ClaimsPrincipalExtensions
├── Migrations/     EF Core миграции
├── Models/         EF Core сущности
├── Services/       бизнес-логика
└── Program.cs      DI, middleware, конфиг
```

- **Endpoints** — принимают запрос, вызывают сервис, возвращают результат
- **Services** — валидация, работа с БД, транзакции
- **Models** — User, Account, Transaction
- **DTOs** — отделяют API от внутренних моделей

## Модель данных

- **User** 1 → * **Account**
- **Account** - номер, баланс, валюта, владелец
- **Transaction** - FromAccountId?, ToAccountId?, сумма, валюта, описание, дата

Связи через конвенции EF Core —-`UserId` + навигация `User`.

## Безопасность

**JWT**
- Access-токен живёт 60 минут
- Алгоритм HS256, секрет в `appsettings.Development.json`
- Claims: `sub` (userId), `email`, `fullName`
- `MapInboundClaims = false` — чтобы `sub` не маппился в `ClaimTypes.NameIdentifier`

**Пароли**
- BCrypt с автоматической солью
- В БД хранится только хеш
- Проверка через `BCrypt.Verify`

**Race condition**
- Переводы выполняются в явной транзакции БД
- `SELECT ... FOR UPDATE` блокирует строки до `COMMIT`
- Два одновременных перевода не снимут больше, чем есть на счёте

## Запуск

Требования: .NET 10 SDK, Docker, `dotnet-ef`.

```
git clone <repo-url>
cd MiniBank

docker compose up -d

cd MiniBank.Api
dotnet ef database update
dotnet run
```

- Scalar UI — `/scalar/v1`
- OpenAPI — `/openapi/v1.json`

## Эндпоинты

**Auth**
| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |

**Accounts**
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/accounts` | Список счетов |
| POST | `/api/accounts` | Создать счёт |
| GET | `/api/accounts/{id}` | Один счёт |
| POST | `/api/accounts/{id}/deposit` | Пополнить счёт |

**Transfers**
| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/transfers` | Перевод между счетами |

**Transactions**
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/transactions` | История транзакций |

**Rates**
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/rates` | Курсы валют (публичный) |

## Пример

Регистрация:

```
curl -X POST https://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","fullName":"Иван"}' \
  -k
```

Перевод:

```
curl -X POST https://localhost:5001/api/transfers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":1,"toAccountId":2,"amount":100,"description":"Перевод"}' \
  -k
```

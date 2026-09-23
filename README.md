# MiniBank

Мини-банк на .NET 10 - REST API для счетов, переводов и истории транзакций.
Учебный проект: JWT-аутентификация, PostgreSQL через EF Core, транзакции БД.

## Стек

**Backend**
| Слой | Технология |
|---|---|
| Платформа | .NET 10 |
| API | ASP.NET Core Minimal API |
| ORM | EF Core 10 + Npgsql |
| БД | PostgreSQL 16 (Docker) |
| Аутентификация | JWT (HS256) |
| Пароли | BCrypt.Net-Next |
| Документация | OpenAPI + Scalar |

**Frontend**
| Слой | Технология |
|---|---|
| Фреймворк | React 18 + Vite + TypeScript |
| Стили | Tailwind CSS + shadcn-style UI |
| Роутинг | React Router v6 |
| HTTP | Axios (интерсептор для Bearer + 401→logout) |
| Иконки | Lucide React |
| Графики | Recharts |

## Возможности

- Регистрация и вход по JWT
- Создание счетов в RUB / USD / EUR
- Пополнение счёта
- Переводы между счетами с проверкой баланса и валюты
- История транзакций — только свои
- Курсы валют
- Dashboard с графиками (динамика баланса, распределение по валютам)
- Защита от IDOR и race condition

## Архитектура

### Backend

```
MiniBank.Api/
├── Data/           AppDbContext
├── DTOs/           модели запросов и ответов (record)
├── Endpoints/      Minimal API endpoints
├── Extensions/     ClaimsPrincipalExtensions
├── Migrations/     EF Core миграции
├── Models/         EF Core сущности (User, Account, Transaction)
├── Services/       бизнес-логика
└── Program.cs      DI, middleware, конфиг
```

- **Endpoints** — принимают запрос, вызывают сервис, возвращают результат
- **Services** — валидация, работа с БД, транзакции
- **Models** — EF Core сущности
- **DTOs** — отделяют API от внутренних моделей

### Frontend

```
minibank-web/src/
├── api/            axios-клиент, методы, типы
├── components/     UI-компоненты, ProtectedRoute, CurrencyIcon, EmptyState
├── contexts/       AuthContext (JWT в localStorage)
├── layouts/        MainLayout (sidebar + header)
├── lib/            утилиты (cn, формат, перевод ошибок)
└── pages/          Login, Register, Dashboard, AccountDetail, Transfer, History, Rates
```

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

**IDOR**
- Все операции фильтруются по `userId` из токена
- На чужой счёт возвращаем **404**, а не 403 — чтобы не подтверждать существование ресурса

**Пароли**
- BCrypt с автоматической солью
- В БД хранится только хеш
- Проверка через `BCrypt.Verify`

**Race condition**
- Переводы выполняются в явной транзакции БД
- `SELECT ... FOR UPDATE` блокирует строки до `COMMIT`
- Два одновременных перевода не снимут больше, чем есть на счёте

## Запуск

### Требования

- .NET 10 SDK
- Node.js 20+
- Docker
- EF Core tools: `dotnet tool install --global dotnet-ef`

### Backend

```bash
docker compose up -d

cd MiniBank.Api
dotnet ef database update
dotnet run
```

- Scalar UI - `http://localhost:5229/scalar/v1`
- OpenAPI - `http://localhost:5229/openapi/v1.json`

### Frontend

```bash
cd minibank-web
npm install
npm run dev
```

- Приложение — `http://localhost:5173`
- API URL настраивается через `VITE_API_URL` (см. `.env.example`)

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

```bash
curl -X POST http://localhost:5229/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","fullName":"Иван"}'
```

Перевод:

```bash
curl -X POST http://localhost:5229/api/transfers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":1,"toAccountId":2,"amount":100,"description":"Перевод"}'
```

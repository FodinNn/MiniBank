# MiniBank

Мини-банк: REST API на .NET 10 и фронтенд на React, можно заводить счета в трёх валютах, переводить деньги между счетами, смотреть историю операций, копить на цели и следить за лимитами расходов.

Учебный проект, но без «сферического банка в вакууме»: тут настоящие транзакции БД с блокировками, BCrypt для паролей и защита от IDOR.

![.NET 10](https://img.shields.io/badge/.NET-10-512BD4)
![React 18](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1)

## Стек

**Backend**

| Что | Чем |
|---|---|
| Платформа | .NET 10 |
| API | ASP.NET Core Minimal API |
| ORM | EF Core 10 + Npgsql |
| БД | PostgreSQL 16 (Docker) |
| Аутентификация | JWT (HS256) |
| Пароли | BCrypt.Net-Next |
| Документация | OpenAPI + Scalar |

**Frontend**

| Что | Чем |
|---|---|
| Фреймворк | React 18 + TypeScript + Vite |
| Стили | Tailwind CSS 4 + Radix UI (shadcn-style) |
| Роутинг | React Router v6 |
| HTTP | Axios (интерсепторы: Bearer + 401 → logout) |
| Графики | Recharts |
| Линт | oxlint |

## Возможности

**Auth** - регистрация, вход по JWT, профиль (имя, смена пароля). Токен живёт 60 минут

**Accounts** - создание счетов в RUB / USD / EUR, пополнение, удаление. Удалить можно только счёт с нулевым балансом. Номер генерируется автоматически (`40817` + случайные цифры)

**Transfers** - переводы между своими счетами, проверяются валюта, баланс, самоперевод и владелец счёта. Всё в одной транзакции БД.

**Transactions** - история только своих операций, фильтры по дате, валюте, сумме и типу (доход/расход), пагинация. Плюс экспорт в CSV через `GET /api/transactions/export`.

**Goals** - накопительные цели: название, сумма, дедлайн, прогресс в процентах. При достижении цели `IsCompleted` ставится сам

**Budgets** - месячные лимиты по категориям. Потраченное считается на лету из транзакций текущего месяца, флаг `isOverBudget` показывает перерасход. Сервис и миграция готовы, эндпоинты в API ещё не подключены - следующий шаг

**Rates** - курсы валют, захардкожены в `RateService`, API не дёргается.

**Dashboard** - сводка: общий баланс, динамика, разбивка по валютам. График - реконструкция по истории операций, а не снапшоты. Для точности нужна таблица `BalanceHistory` - в планах.

## Архитектура

### Backend

```
MiniBank.Api/
├── Data/           AppDbContext, DbSeeder (тестовые данные для dev)
├── DTOs/           record-модели запросов и ответов, по папке на фичу
├── Endpoints/      Minimal API: Auth, Account, Transfer, Transaction, Rate, Goal
├── Extensions/     ClaimsPrincipalExtensions (user.GetUserId())
├── Migrations/     EF Core миграции
├── Middleware/     ExceptionHandlingMiddleware — единый JSON на ошибки
├── Models/         Сущности: User, Account, Transaction, Goal, Budget
├── Services/       Бизнес-логика, по интерфейсу на фичу
└── Program.cs      DI, JWT, CORS, middleware pipeline
```

Схема простая: `Endpoint → Service → DbContext`. Эндпоинт принимает запрос, дёргает сервис и мапит результат в HTTP-код. Вся логика (валидация, БД, транзакции) - в сервисах. Контроллеров нет - Minimal API с группами (`MapGroup`) справляется

Фронтенд знает только про DTO, EF-сущности наружу не торчат

### Frontend

```
minibank-web/src/
├── api/            axios-клиент + методы по фичам (auth, accounts, goals...)
├── components/     UI-кит (button, dialog, select...), ProtectedRoute, ErrorBoundary
├── contexts/       AuthContext — токен в localStorage, юзер в состоянии
├── layouts/        MainLayout — sidebar + header
├── lib/            format (деньги, даты), errors (перевод ошибок API)
└── pages/          Login, Register, Dashboard, AccountDetail, Transfer,
                     History, Rates, Goals, Settings
```

`client.ts` - сердце фронтенда: подставляет `Bearer` из `localStorage` в каждый запрос, а на 401 выкидывает токен и отправляет на `/login`. Роуты закрыты `ProtectedRoute`, `Dashboard` лениво грузится вместе с recharts (он тяжёлый).

## Модель данных

```
User 1 ──── * Account
User 1 ──── * Goal
User 1 ──── * Budget
Account * ── * Transaction (через FromAccountId / ToAccountId)
```

`Transaction` — не совсем «дочка» счёта, а отдельная сущность с двумя nullable-ссылками: пополнение имеет только `ToAccountId`, расход — только `FromAccountId`, перевод — обе. Так история не разваливается при удалении счёта.

Мелочи, которые важны:

- `decimal` для денег — `double` теряет копейки
- Уникальные индексы на `User.Email` и `Account.Number`
- CHECK-констрейнт `Balance >= 0` прямо в БД — даже баг в коде не уведёт баланс в минус
- Индексы на `FromAccountId`, `ToAccountId` и `(ToAccountId, CreatedAt)` — под фильтры истории

## Безопасность

**JWT (HS256)** - секрет в `appsettings.Development.json`, claims: `sub` (userId), `email`, `fullName`. `MapInboundClaims = false` - чтобы `sub` не превращался в `ClaimTypes.NameIdentifier` и читался как есть.

**Пароли** - BCrypt с автоматической солью, в БД только хеш. Сверка через `BCrypt.Verify`

**IDOR** - каждый запрос фильтруется по `userId` из токена, а не из параметров. На чужой счёт - `404`, а не `403`: не подтверждаем, что ресурс вообще существует.

**Race condition** - перевод выполняется в явной транзакции, оба счёта блокируются через `SELECT ... FOR UPDATE`. Два параллельных перевода не снимут больше, чем лежит на счёте. Плюс CHECK-констрейнт как последний рубеж.

**CORS** - whitelist на `http://localhost:5173`, никаких `AllowAnyOrigin`.

**Ошибки** - `ExceptionHandlingMiddleware` в prod отдаёт `{"error":"Internal server error"}` без стектрейса, в dev - с ним.

## Запуск

Самый быстрый путь - через `make`:

```bash
git clone <repo-url>
cd MiniBank

make up        # поднять PostgreSQL в Docker
make migrate   # применить миграции (первый раз)
make api       # запустить API в одном терминале
make web       # запустить фронт в другом терминале
```

## Эндпоинты

**Auth**

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация, в ответе JWT |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |
| PUT | `/api/auth/me` | Обновить имя |
| POST | `/api/auth/change-password` | Смена пароля |

**Accounts**

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/accounts` | Список своих счетов |
| POST | `/api/accounts` | Создать счёт |
| GET | `/api/accounts/{id}` | Один счёт |
| POST | `/api/accounts/{id}/deposit` | Пополнить |
| DELETE | `/api/accounts/{id}` | Удалить (только при нуле) |

**Transfers**

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/transfers` | Перевод между счетами |

**Transactions**

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/transactions` | История: `page`, `from`, `to`, `currency`, `type`, `minAmount`, `maxAmount` |
| GET | `/api/transactions/export` | Экспорт в CSV |

**Goals**

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/goals` | Список целей с прогрессом |
| POST | `/api/goals` | Создать цель |
| POST | `/api/goals/{id}/add` | Пополнить цель |
| DELETE | `/api/goals/{id}` | Удалить цель |

**Rates и прочее**

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/rate` | Курсы валют (публичный) |
| GET | `/api/hello` | Health check |

Все, кроме `register` / `login` / `rate` / `hello`, требуют `Authorization: Bearer <token>`.

## Автор

Учебный пет-проект, писал [@foddin](tg). Обратная связь приветствуется - но это пока про банк для себя, не для продакшена.

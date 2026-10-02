.PHONY: help up down restart logs migrate psql build test clean api web

help:
	@echo "MiniBank — команды:"
	@echo ""
	@echo "  make up        — запустить Postgres + API + Frontend"
	@echo "  make down      — остановить всё"
	@echo "  make api       — только API"
	@echo "  make web       — только фронт"
	@echo "  make db        — только Postgres"
	@echo ""
	@echo "  make build     — собрать бэк и фронт"
	@echo "  make migrate   — применить миграции"
	@echo "  make psql      — открыть psql в контейнере"
	@echo "  make clean     — снести БД и артефакты"

db:
	docker compose up -d

db-down:
	docker compose down

api:
	cd MiniBank.Api && dotnet run

build:
	cd MiniBank.Api && dotnet build
	cd minibank-web && npm run build

migrate:
	cd MiniBank.Api && dotnet ef database update

psql:
	docker exec -it minibank-db psql -U minibank -d minibank

web:
	cd minibank-web && npm run dev

install-web:
	cd minibank-web && npm install

up: db
	@echo "Postgres запущен"
	@echo ""
	@echo "Дальше — в двух терминалах:"
	@echo "  make api     — бэкенд на :5229"
	@echo "  make web     — фронт на :5173"
	@echo ""
	@echo "Открыть: http://localhost:5173"
	@echo "Scalar:  http://localhost:5229/scalar/v1"

down: db-down
	@echo "Остановлено"

clean:
	docker compose down -v
	cd MiniBank.Api && rm -rf bin obj
	cd minibank-web && rm -rf node_modules dist
	@echo "Очищено (БД, bin, obj, node_modules, dist)"
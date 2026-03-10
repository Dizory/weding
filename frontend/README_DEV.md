# Разработка страницы приглашений с hot reload

Чтобы не перезапускать сервер при каждом изменении CSS/JS:

1. **Запустите Aspire** (как обычно):
   ```
   dotnet run --project TestAspire.AppHost
   ```

2. **Откройте дашборд Aspire** — в нём появится ресурс **frontend** (приглашения).

3. **Откройте URL ресурса frontend** (из дашборда) вместо URL сервера — это Vite dev‑сервер с HMR. Изменения в CSS и коде будут применяться без перезапуска.

4. Для теста приглашения: `http://<frontend-url>/i/test` (подставьте slug вашего приглашения).

---

**Без Aspire** (отдельно):
- Терминал 1: `dotnet run --project TestAspire.Server`
- Терминал 2: `cd frontend && npm run dev`
- Откройте `http://localhost:5173/i/test` (или порт, который покажет Vite)

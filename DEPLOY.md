# Развёртывание TestAspire (GitHub + Coolify)

Пошаговая инструкция по настройке автоматического развёртывания через GitHub Actions и Coolify.

---

## Часть 1. Репозиторий на GitHub

### 1.1. Создание репозитория

1. Зайдите на [github.com](https://github.com) и войдите в аккаунт.
2. Нажмите **+** → **New repository**.
3. Заполните:
   - **Repository name**: `TestAspire` (или другое имя).
   - **Visibility**: Private или Public.
   - **НЕ** ставьте галочку "Add a README" — репозиторий должен быть пустым.
4. Нажмите **Create repository**.

### 1.2. Первый push с локального компьютера

Откройте терминал в папке проекта и выполните:

```powershell
cd C:\Users\zorin.dmitry\TestAspire

# Инициализация Git (если ещё не сделано)
git init

# Добавить все файлы
git add .

# Первый коммит
git commit -m "Initial commit: wedding invitations"

# Подключить удалённый репозиторий (замените YOUR_USERNAME и REPO_NAME на свои)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Отправить код (ветка main)
git branch -M main
git push -u origin main
```

При запросе логина используйте ваш GitHub username и [Personal Access Token](https://github.com/settings/tokens) вместо пароля.

---

## Часть 2. GitHub Actions (CI/CD)

### 2.1. Personal Access Token для публикации образов

> **Не путать с SSH-ключом!** PAT — это токен (строка вида `ghp_xxxx`), который создаётся в веб-интерфейсе GitHub. SSH-ключ нужен только для `git push` по SSH; для публикации образов в ghcr.io используется именно PAT.

1. GitHub → **Settings** (ваш профиль) → **Developer settings** → **Personal access tokens**.
2. **Generate new token** → **Generate new token (classic)**.
3. Задайте имя, например `Coolify deploy`.
4. Отметьте право **write:packages** (публикация образов).
5. Нажмите **Generate token** и **скопируйте токен** (он больше не покажется).

### 2.2. Секреты репозитория

**Обычно ничего добавлять не нужно.** Workflow использует встроенный `GITHUB_TOKEN`, который GitHub создаёт автоматически для каждого запуска Actions. У него уже есть права на публикацию в ghcr.io.

Если по какой-то причине нужен свой токен (например, для приватного репозитория):
1. Откройте репозиторий → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**.
3. **Важно:** имя секрета **не должно** начинаться с `GITHUB_` (такие имена зарезервированы).
4. Добавьте:
   - **Name**: `GHCR_TOKEN` (или `PAT`, `REGISTRY_TOKEN` — любое без префикса GITHUB_)
   - **Value**: ваш Personal Access Token с правом `write:packages`

Если добавляете `GHCR_TOKEN`, в workflow нужно заменить `secrets.GITHUB_TOKEN` на `secrets.GHCR_TOKEN`.

### 2.3. Проверка workflow

1. Сделайте любое изменение в коде и запушьте:
   ```powershell
   git add .
   git commit -m "Test CI"
   git push
   ```
2. В репозитории откройте вкладку **Actions**.
3. Дождитесь успешного завершения workflow **Build and Push Docker image**.
4. В репозитории откройте **Packages** (справа) — должен появиться образ `server`.

---

## Часть 3. Coolify

### 3.1. Создание приложения

1. Войдите в Coolify.
2. **+ Add New Resource** → **Docker Compose**.
3. Укажите:
   - **Name**: `wedding-invitations`.
   - **Source**: Git Repository.
   - **Repository URL**: `https://github.com/YOUR_USERNAME/REPO_NAME`.
   - **Branch**: `main`.
   - **Docker Compose Location**: `TestAspire.AppHost/aspire-output/docker-compose.yaml`.
4. Сохраните.

### 3.2. Переменные окружения

1. Откройте приложение → **Environment Variables**.
2. Добавьте:

| Переменная               | Значение                                                                 | Обязательно |
|--------------------------|--------------------------------------------------------------------------|-------------|
| `CACHE_PASSWORD`         | `1@Rdent1996`                                                            | да          |
| `SERVER_IMAGE`           | `ghcr.io/YOUR_USERNAME/REPO_NAME/server:latest` (подставьте свои данные) | да          |
| `SERVER_PORT`            | `8080`                                                                   | да          |
| `Crm__DefaultAdminLogin`  | `waschbarpelz` (или ваш логин для входа в CRM)                           | **да**      |
| `Crm__DefaultAdminPassword` | `ваш_пароль` (пароль для входа в CRM)                                 | **да**      |
| `Crm__JwtSecret`         | случайная строка не менее 32 символов (для JWT)                         | рекомендуемо|

**Важно:** без `Crm__DefaultAdminLogin` и `Crm__DefaultAdminPassword` вход в CRM не будет работать.

### 3.3. Доступ к приватному образу (если репозиторий приватный)

1. В Coolify: **Settings** → **Docker Registries** (или в настройках приложения).
2. Добавьте реестр:
   - **URL**: `ghcr.io`
   - **Username**: ваш GitHub username.
   - **Password**: Personal Access Token с правом `read:packages`.

### 3.4. Домен и HTTPS

1. В настройках приложения → **Domains**.
2. Добавьте домен: `weding.zorin-server.ru`.
3. Включите **HTTPS** (Let's Encrypt).

### 3.5. Первый деплой

1. Нажмите **Deploy**.
2. Дождитесь завершения.
3. Откройте `https://weding.zorin-server.ru`.

---

## Часть 4. Автообновление (webhook)

### 4.1. Webhook в Coolify

1. Приложение → **Webhooks** / **Deploy Hooks**.
2. Создайте webhook.
3. Скопируйте URL webhook.

### 4.2. Секрет в GitHub

1. Репозиторий → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**:
   - **Name**: `COOLIFY_WEBHOOK_URL`
   - **Value**: URL webhook из Coolify.

### 4.3. Включение webhook в workflow

В файле `.github/workflows/deploy.yml` раскомментируйте блок `Notify Coolify` (шаг с `curl`). Либо он уже включён — проверьте, что шаг выполняется после успешного push образа.

После этого при каждом push в `main` GitHub Actions соберёт образ, опубликует его и вызовет webhook Coolify для автоматического перезапуска.

---

## Краткий чеклист

- [ ] Репозиторий создан на GitHub
- [ ] Код запушен в репозиторий
- [ ] Workflow в Actions выполняется успешно
- [ ] Образ появился в Packages
- [ ] Приложение создано в Coolify
- [ ] Переменные `CACHE_PASSWORD`, `SERVER_IMAGE`, `SERVER_PORT` заданы
- [ ] Домен `weding.zorin-server.ru` настроен
- [ ] Webhook Coolify добавлен в секреты GitHub
- [ ] Проверено автообновление после push

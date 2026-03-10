# Сборка фронтенда
FROM node:20 AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN node ./node_modules/typescript/bin/tsc -b && node ./node_modules/vite/bin/vite.js build

# Сборка сервера
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS server-build
WORKDIR /app

COPY TestAspire.sln ./
COPY TestAspire.Server/ ./TestAspire.Server/
RUN dotnet restore TestAspire.Server/TestAspire.Server.csproj
RUN dotnet publish TestAspire.Server/TestAspire.Server.csproj -c Release -o /app/publish --no-restore

# Финальный образ
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=server-build /app/publish ./
COPY --from=frontend-build /app/frontend/dist ./wwwroot

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "TestAspire.Server.dll"]

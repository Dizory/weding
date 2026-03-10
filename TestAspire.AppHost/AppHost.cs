var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("compose");

var cache = builder.AddRedis("cache")
    .PublishAsDockerComposeService((resource, service) => service.Name = "cache");

var sqlite = builder.AddSqlite("invitations");

var server = builder.AddProject<Projects.TestAspire_Server>("server")
    .WithReference(cache)
    .WithReference(sqlite)
    .WaitFor(cache)
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints()
    .PublishAsDockerComposeService((resource, service) => service.Name = "server");

// Frontend (приглашения) и CRM — Vite dev-серверы с HMR для отладки CSS/JS без перезапуска.
// Сервер отдаёт собранный frontend из wwwroot при продакшене; для разработки используйте URL frontend из дашборда.
var frontend = builder.AddViteApp("frontend", "../frontend")
    .WithReference(server)
    .WaitFor(server);

var crm = builder.AddViteApp("crm", "../crm")
    .WithReference(server)
    .WaitFor(server);

builder.Build().Run();

using Backend.Data;
using Backend.Handlers;
using Backend.Models.Repositories;
using Microsoft.EntityFrameworkCore;

using DotNetEnv;
Env.Load();

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

// Orígenes permitidos para el frontend en desarrollo.
// Si necesitas añadir más orígenes (staging, prod), agrégalos a la lista.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? new[] { "" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

builder.Services.AddScoped<UserAccessRepository>();
builder.Services.AddScoped<AuthHandler>();
builder.Services.AddScoped<PlatformHandler>();

builder.Services.AddDbContext<UserAccessDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("HospitalInfantilDb")
    );
});

var app = builder.Build();

//if (app.Environment.IsDevelopment())
//{
app.MapOpenApi();

app.UseSwagger();
app.UseSwaggerUI();
//}

// CORS debe ir antes de UseAuthorization y MapControllers.
app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();
app.MapControllers();
app.Run();

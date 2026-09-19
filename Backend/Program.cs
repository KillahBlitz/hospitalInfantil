using DotNetEnv;
using Backend.Data;
using Backend.Handlers;
using Backend.Models.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.BearerToken;

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

builder.Services.AddAuthentication(BearerTokenDefaults.AuthenticationScheme)
    .AddBearerToken(options => options.BearerTokenExpiration = TimeSpan.FromHours(8));
builder.Services.AddAuthorization();
builder.Services.AddScoped<SessionTokenService>();

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

builder.Services.AddScoped<UserAccessRepository>();
builder.Services.AddScoped<AuthHandler>();
builder.Services.AddScoped<PlatformHandler>();
builder.Services.AddScoped<HumanResourcesRepository>();
builder.Services.AddScoped<HumanResourcesHandler>();

builder.Services.AddDbContext<UserAccessDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("HospitalInfantilDb")
    );
});

builder.Services.AddDbContext<HumanResourcesDbContext>(options =>
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

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

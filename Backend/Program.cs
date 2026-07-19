using Backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSwaggerGen(); 
builder.Services.AddOpenApi();

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

app.UseAuthorization();
app.MapControllers();
app.Run();
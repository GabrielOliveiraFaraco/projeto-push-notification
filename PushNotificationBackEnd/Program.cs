using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<FilaMensagensService>();

// Optional: allow CORS for SignalR clients during development
builder.Services.AddCors(options =>
{
	options.AddDefaultPolicy(policy =>
	{
		policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true);
	});
});

var app = builder.Build();

app.UseCors();

app.MapControllers();
app.MapHub<NotificacaoHub>("/notificacaoHub");

app.Run();


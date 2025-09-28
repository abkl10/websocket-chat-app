using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Fleck;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Cors;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ChatDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(8, 0, 36)))
);

builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<ChatDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<JwtService>(); 
builder.Services.AddControllers(); 
builder.Services.AddLogging(config =>
{
    config.AddConsole();
    config.AddDebug();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseRouting();  
app.UseCors("AllowFrontend");
app.UseAuthentication(); 
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

var jwtService = app.Services.CreateScope().ServiceProvider.GetRequiredService<JwtService>();
StartWebSocketServer(jwtService);

Console.WriteLine("WebSocket server starting...");
Console.WriteLine("HTTP server starting...");

app.Run();

void StartWebSocketServer(JwtService jwtService)
{
    var clients = new ConcurrentDictionary<IWebSocketConnection, string>();

    var server = new WebSocketServer("ws://0.0.0.0:8181");
    
    server.Start(socket =>
    {
        socket.OnOpen = () =>
        {
            var token = ExtractTokenFromPath(socket.ConnectionInfo.Path);
            if (string.IsNullOrWhiteSpace(token))
            {
                socket.Close();
                Console.WriteLine("Connection rejected: No token");
                return;
            }

            var username = jwtService.ValidateToken(token);
            if (string.IsNullOrWhiteSpace(username))
            {
                socket.Close();
                Console.WriteLine("Connection rejected: Invalid token");
                return;
            }

            clients[socket] = username;
            Console.WriteLine($"{username} connected.");
            BroadcastUserList();
        };

        socket.OnClose = () =>
        {
            if (clients.TryRemove(socket, out var username))
            {
                Console.WriteLine($"👋 {username} disconnected.");
                BroadcastUserList();
            }
        };

        socket.OnMessage = message =>
        {
            if (!clients.TryGetValue(socket, out var username))
            {
                socket.Send("Not authenticated");
                return;
            }

            try
            {
                var data = JsonSerializer.Deserialize<Dictionary<string, string>>(message);
                if (data is null || !data.ContainsKey("type")) return;

                var type = data["type"];

                // Chat message
                if (type == "chat" && data.ContainsKey("message"))
                {
                    var text = data["message"];
                    var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm");

                    var payload = new
                    {
                        type = "chat",
                        username = username,
                        message = text,
                        timestamp
                    };

                    var json = JsonSerializer.Serialize(payload);

                    foreach (var client in clients.Keys)
                    {
                        if (client.IsAvailable)
                        {
                            client.Send(json);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing message: {ex.Message}");
            }
        };

        socket.OnError = ex =>
        {
            Console.WriteLine($"WebSocket error: {ex.Message}");
            if (clients.TryRemove(socket, out var username))
            {
                Console.WriteLine($"Removed {username} due to error");
                BroadcastUserList();
            }
        };
    });

    void BroadcastUserList()
    {
        try
        {
            var users = clients.Values.Distinct().ToList();

            var payload = new
            {
                type = "users",
                users = users
            };

            var json = JsonSerializer.Serialize(payload);

            foreach (var client in clients.Keys.Where(c => c.IsAvailable))
            {
                client.Send(json);
            }

            Console.WriteLine($"📢 Updated user list sent. Online users: {users.Count}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error broadcasting user list: {ex.Message}");
        }
    }

    string? ExtractTokenFromPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;

        var query = path.Split('?', 2).Length > 1
            ? path.Split('?', 2)[1]
            : null;

        if (query == null) return null;

        foreach (var pair in query.Split('&'))
        {
            var kv = pair.Split('=');
            if (kv.Length == 2 && kv[0] == "token")
            {
                return Uri.UnescapeDataString(kv[1]);
            }
        }

        return null;
    }

    Console.WriteLine("WebSocket server running on ws://localhost:8181");
    Console.WriteLine("Press Ctrl+C to stop the server");
}
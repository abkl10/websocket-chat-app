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

var app = builder.Build();

var jwtService = app.Services.CreateScope().ServiceProvider.GetRequiredService<JwtService>();

app.RunAsync();


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
                client.Send(json);
            }
        }
    };
});


void BroadcastUserList()
{
    var users = clients.Values.Distinct().ToList();

    var json = JsonSerializer.Serialize(new
    {
        type = "users",
        users = users
    });

    foreach (var client in clients.Keys)
    {
        client.Send(json);
    }

    Console.WriteLine("📢 Updated user list sent.");
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
Console.ReadLine();
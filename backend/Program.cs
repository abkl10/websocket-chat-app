using backend.Data;
using Fleck;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;
using System.Text.Json;
using backend.Services;


var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ChatDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36)))
);

builder.Services.AddSingleton<JwtService>();
builder.Services.AddControllers();

var app = builder.Build();

var clients = new ConcurrentDictionary<IWebSocketConnection, string>();

var server = new WebSocketServer("ws://0.0.0.0:8181");
server.Start(socket =>
{
    socket.OnOpen = () =>
    {
        Console.WriteLine("Connected: " + socket.ConnectionInfo.ClientIpAddress);
    };

    socket.OnClose = () =>
    {
        clients.TryRemove(socket, out var username);
        Console.WriteLine("Disconnected: " + socket.ConnectionInfo.ClientIpAddress);
        BroadcastUserList();
    };

    socket.OnMessage = message =>
    {
        var data = JsonSerializer.Deserialize<Dictionary<string, string>>(message);

        if (data is null || !data.ContainsKey("type")) return;

        var type = data["type"];

        if (type == "login" && data.ContainsKey("username"))
        {
            var username = data["username"];
            clients[socket] = username;
            Console.WriteLine($"{username} connected.");
            BroadcastUserList();
        }
        else if (type == "chat" && data.ContainsKey("message"))
        {
            if (!clients.ContainsKey(socket))
            {
                socket.Send("You must login first.");
                return;
            }

            var username = clients[socket];
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm");

            var payload = new
            {
                type = "chat",
                username = username,
                message = data["message"],
                timestamp = timestamp
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
    var userList = clients.Values.Distinct().ToList();

    var payload = new
    {
        type = "users",
        users = userList
    };

    var json = JsonSerializer.Serialize(payload);

    foreach (var client in clients.Keys)
    {
        client.Send(json);
    }

    Console.WriteLine("Updated users list sent.");
}
app.Run();

Console.WriteLine("WebSocket server started at ws://localhost:8181");
Console.ReadLine();
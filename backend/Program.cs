using System.Collections.Concurrent;
using System.Text.Json;
using Fleck;

var clients = new ConcurrentDictionary<IWebSocketConnection, string>();

var server = new WebSocketServer("ws://0.0.0.0:8181");
server.Start(socket =>
{
    socket.OnOpen = () =>
    {
        Console.WriteLine("Client connected.");
    };

    socket.OnClose = () =>
    {
        if (clients.TryRemove(socket, out var username))
        {
            Console.WriteLine($"{username} disconnected.");
            BroadcastUserList();
        }
    };

    socket.OnMessage = message =>
    {
        var data = JsonSerializer.Deserialize<Dictionary<string, string>>(message);
        if (data is null || !data.ContainsKey("type")) return;

        var type = data["type"];

        // User login
        if (type == "login" && data.ContainsKey("username"))
        {
            var username = data["username"];
            clients[socket] = username;
            Console.WriteLine($"{username} logged in.");
            BroadcastUserList();
        }
        // Chat message
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

Console.WriteLine("✅ WebSocket server running on ws://localhost:8181");
Console.ReadLine();
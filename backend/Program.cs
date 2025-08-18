using Fleck;
using System.Collections.Concurrent;
using System.Text.Json;

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
        }
        else if (type == "chat" && data.ContainsKey("message"))
        {
            if (!clients.ContainsKey(socket))
            {
                socket.Send("You must login first.");
                return;
            }

            var username = clients[socket];
            var payload = new
            {
                type = "chat",
                username = username,
                message = data["message"]
            };

            var json = JsonSerializer.Serialize(payload);
            foreach (var client in clients.Keys)
            {
                client.Send(json);
            }
        }
    };
});

Console.WriteLine("WebSocket server started at ws://localhost:8181");
Console.ReadLine();
using Fleck;
using System.Collections.Concurrent;

var allSockets = new ConcurrentBag<IWebSocketConnection>();

var server = new WebSocketServer("ws://0.0.0.0:8181");
server.Start(socket =>
{
    socket.OnOpen = () =>
    {
        Console.WriteLine("Connected: " + socket.ConnectionInfo.ClientIpAddress);
        allSockets.Add(socket);
    };

    socket.OnClose = () =>
    {
        Console.WriteLine("Disconnected: " + socket.ConnectionInfo.ClientIpAddress);
    };

    socket.OnMessage = message =>
    {
        Console.WriteLine("Message: " + message);
        foreach (var s in allSockets)
        {
            s.Send(message);
        }
    };
});

Console.WriteLine("WebSocket server started at ws://localhost:8181");
Console.ReadLine();
import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    console.log("✅ Client connected");

    ws.on("message", (msg) => {
        console.log("📩 Received:", msg.toString());
        console.log("Clients size:", wss.clients.size);

        // Broadcast the received message to all other connected clients.
        wss.clients.forEach((client) => {
            console.log("Client readyState:", client.readyState);
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
            }
        });
    });
});

console.log("🚀 WebSocket server running at ws://localhost:8080");

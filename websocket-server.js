import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    console.log("✅ Client connected");

    ws.on("message", (msg) => {
        // Echo back.
        ws.send(msg.toString());
    });
});

console.log("🚀 WebSocket server running at ws://localhost:8080");

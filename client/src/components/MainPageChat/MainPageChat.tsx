import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3005", {
  withCredentials: true,
});

export default function MainPageChat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);

  useEffect(() => {
    socket.on("chat:message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat:message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chat:message", message);
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat</h2>
      <div style={{ border: "1px solid #ccc", height: "200px", overflowY: "auto", padding: "10px" }}>
        {chat.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  mainSocketClient,
  type MainChatMessage,
} from '../../socket/socketMainPage';

export default function MainPageChat() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<MainChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const setupChatListeners = () => {
      if (!mainSocketClient.isConnected) {
        setConnecting(true);
        setConnected(false);
        return;
      }

      const socket = mainSocketClient.socket;
      setConnected(true);
      setConnecting(false);

      const handleConnect = () => {
        setConnected(true);
        setConnecting(false);
      };
      const handleDisconnect = () => {
        setConnected(false);
        setConnecting(false);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      socket.on('chat:history', (items: MainChatMessage[]) => {
        console.log('📜 Received chat history:', items.length, 'messages');
        setChat(items);
      });

      socket.on('chat:message', (msg: MainChatMessage) => {
        console.log('💬 Received new chat message:', msg);
        setChat((prev) => [...prev, msg]);
      });

      // Request chat history if socket is already connected
      console.log('📜 Requesting chat history...');
      socket.emit('request:chat:history');

      socket.on('connect_error', (err) => {
        console.error('MainPage socket connect_error:', err);
        setConnected(false);
        setConnecting(false);
      });

      socket.on('error', (err) => {
        console.error('MainPage chat error:', err);
      });

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('chat:history');
        socket.off('chat:message');
        socket.off('connect_error');
        socket.off('error');
      };
    };

    // Set up listeners immediately if socket is connected
    const cleanup = setupChatListeners();

    // If socket is not connected, wait for it to connect
    if (!mainSocketClient.isConnected) {
      const checkConnection = setInterval(() => {
        if (mainSocketClient.isConnected) {
          clearInterval(checkConnection);
          setupChatListeners();
        }
      }, 100);

      return () => {
        clearInterval(checkConnection);
        if (cleanup) cleanup();
      };
    }

    return cleanup;
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat]);

  const sendMessage = () => {
    const text = message.trim();
    if (!text || !connected) return;
    mainSocketClient.socket.emit('chat:message', text);
    setMessage('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Общий чат
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: connecting
              ? 'orange'
              : connected
              ? 'green'
              : 'red',
          }}
          title={
            connecting ? 'Подключение...' : connected ? 'Онлайн' : 'Оффлайн'
          }
        />
      </h2>

      <div
        ref={listRef}
        style={{
          border: '1px solid #ccc',
          height: '200px',
          overflowY: 'auto',
          padding: '10px',
        }}
      >
        {chat.map((msg) => (
          <p key={msg.id} title={new Date(msg.createdAt).toLocaleString()}>
            <b>{msg.user.username}:</b> {msg.text}
          </p>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          connecting
            ? 'Подключение…'
            : connected
            ? 'Напишите сообщение...'
            : 'Отключено'
        }
        disabled={!connected}
        rows={2}
        style={{ width: '100%', marginTop: '10px' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <button
        onClick={sendMessage}
        disabled={!connected || !message.trim()}
        style={{ marginTop: '5px' }}
      >
        Отправить
      </button>
    </div>
  );
}

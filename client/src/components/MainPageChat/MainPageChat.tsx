import { useEffect, useRef, useState } from 'react';
import {
  mainSocketClient,
  type MainChatMessage,
} from '../../socket/socketMainPage';
import styles from '../../pages/MainPage/MainPage.module.css';

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
    <div className={styles.chat}>
      <h3 className={styles.chatTitle}>
        Общий чат
        <span
          className={`${styles.connectionIndicator} ${
            connecting ? styles.connecting : connected ? '' : styles.offline
          }`}
          title={
            connecting ? 'Подключение...' : connected ? 'Онлайн' : 'Оффлайн'
          }
        />
      </h3>

      <div ref={listRef} className={styles.chatList}>
        {chat.map((msg) => (
          <div
            key={msg.id}
            className={styles.message}
            title={new Date(msg.createdAt).toLocaleString()}
          >
            <span className={styles.author}>{msg.user.username}:</span>
            <span className={styles.text}>{msg.text}</span>
          </div>
        ))}
      </div>



      <div className={styles.chatForm}>
        <input
          type="text"
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
          className={styles.chatInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !message.trim()}
          className={styles.sendButton}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

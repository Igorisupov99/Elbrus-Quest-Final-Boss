import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './LobbyPage.module.css';
import { Button } from '../../components/common/Button/Button';
import { socketClient, type ChatHistoryItem, type IncomingChatMessage, type SystemEvent } from '../../socket/socketLobbyPage';

export function LobbyPage() {
    const { id } = useParams<{ id: string }>();
    const lobbyId = useMemo(() => Number(id), [id]);
    const navigate = useNavigate();

    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState<ChatHistoryItem[]>([]);
    const [input, setInput] = useState('');
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [history]);

    useEffect(() => {
        if (!lobbyId || Number.isNaN(lobbyId)) {
            navigate('/');
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        socketClient.connectWithToken(token);

        const s = socketClient.socket;

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onConnectError = (err: any) => {
            console.error('connect_error:', err);
            setConnected(false);
        }

        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);
        s.on('connect_error', onConnectError);

        s.once('connect', () => {
            s.emit('joinLobby', { lobbyId });
        });

        const onHistory = (items: ChatHistoryItem[]) => {
            setHistory(items);
        };
        s.on('chat:history', onHistory);

        const onChatMessage = (msg: IncomingChatMessage) => {
            setHistory(prev => [...prev, msg]);
        };
        s.on('chat:message', onChatMessage);

        const onSystem = (evt: SystemEvent) => {
            const text = evt.type === 'join' ? `${evt.username} вошёл в лобби` : `${evt.username} покинул лобби`;
            setHistory(prev => [
                ...prev,
                {
                    id: Date.now(),
                    text,
                    user: { id: 0, username: 'system' },
                    createdAt: new Date().toISOString(),
                },
            ]);
        };
        s.on('system', onSystem);

        const onError = (payload: any) => {
            console.error('chat error:', payload);
        };
        s.on('error', onError);

        return () => {
            s.off('connect', onConnect);
            s.off('disconnect', onDisconnect);
            s.off('connect_error', onConnectError);
            s.off('chat:history', onHistory);
            s.off('chat:message', onChatMessage);
            s.off('system', onSystem);
            s.off('error', onError);
            s.disconnect();
    };
    }, [lobbyId, navigate]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text || !connected) return;

        socketClient.socket.emit('chat:message', { lobbyId, text });
        setInput('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    const handleExiteLobby = () => {
      if (connected) {
        socketClient.socket.emit('leaveLobby', { lobbyId });
        socketClient.socket.disconnect();
      }
      navigate('/');
    }

  return (
    <div className={styles.lobbyPage}>
      <div className={styles.gameArea}>
        <h2 className={styles.placeholder}>Игровое поле</h2>
        {/* Добавить функционал(собственно, игра) */}
      </div>

      <div className={styles.sidebar}>
        <Button className={styles.exitButton} onClick={handleExiteLobby}>
          Выйти из комнаты
        </Button>

        <div className={styles.chat}>
          <h3 className={styles.chatTitle}>Чат комнаты {connected ? '🟢' : '🔴'}</h3>
          <div ref={listRef} className={styles.chatList}>
            {history.map((m) => (
              <div
                key={m.id}
                className={
                  m.user.username === 'system'
                    ? styles.systemMessage
                    : styles.message
                }
                title={new Date(m.createdAt).toLocaleString()}
              >
                {m.user.username !== 'system' && (
                  <span className={styles.author}>{m.user.username}:</span>
                )}
                <span className={styles.text}>{m.text}</span>
              </div>
            ))}
          </div>

          <form className={styles.chatForm} onSubmit={handleSubmit}>
            <input
              className={styles.chatInput}
              placeholder={connected ? 'Напишите сообщение…' : 'Подключение…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!connected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              type="submit"
              className={styles.sendButton}
              disabled={!connected || !input.trim()}
            >
              Отправить
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

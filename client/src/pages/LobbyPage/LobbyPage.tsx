import styles from './LobbyPage.module.css';
import { Button } from '../../components/common/Button/Button';

export function LobbyPage() {
  return (
    <div className={styles.lobbyPage}>
      <div className={styles.gameArea}>
        <h2 className={styles.placeholder}>Игровое поле</h2>
        {/* Добавить функционал(собственно, игра) */}
      </div>

      <div className={styles.sidebar}>
        <Button className={styles.exitButton}>
          Выйти из комнаты
        </Button>
        {/* Добавить функционал(выход из лобби) */}

        <div className={styles.chat}>
          <h3 className={styles.chatTitle}>Чат комнаты</h3>
          {/* Добавить функционал(чат) */}
        </div>
      </div>
    </div>
  );
}

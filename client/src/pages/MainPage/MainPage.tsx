import type { JSX } from 'react';
import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import MainPageChat from '../../components/MainPageChat/MainPageChat';
import styles from './MainPage.module.css';
import ModelPageCreateRoom from '../../components/ModelPageCreateRoom/ModelPageCreateRoom';
import ModelPageRedirectLobby from '../../components/ModelPageRedirectLobby/ModelPageRedirectLobby';

export function MainPage(): JSX.Element {
  const items = useAppSelector((state) => state.mainPage.items);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  return (
    <>
      <MainPageChat />
      <h2>Доступные комнаты:</h2>
      {items.map((item) => (
        <ul key={item.id}>
          <li
            className={styles.roomItem}
            onClick={() => {
              setSelectedRoomId(item.id);
              setIsRedirectModalOpen(true);
            }}
          >
            {item.title}
          </li>
        </ul>
      ))}

      <button onClick={() => setIsModalOpen(true)}>Создать комнату</button>

      {/* Modal for creating a room */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            <ModelPageCreateRoom setIsModalOpen={setIsModalOpen} />
          </div>
        </div>
      )}

      {/* Modal for redirecting to lobby */}
      {isRedirectModalOpen && selectedRoomId !== null && (
        <div className={styles.modalOverlay} onClick={() => setIsRedirectModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsRedirectModalOpen(false)}>×</button>
            <ModelPageRedirectLobby
              setIsModalOpen={setIsRedirectModalOpen}
              roomId={selectedRoomId}
            />
          </div>
        </div>
      )}
    </>
  );
}

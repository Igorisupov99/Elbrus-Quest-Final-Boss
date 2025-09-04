import type { JSX } from 'react';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import MainPageChat from '../../components/MainPageChat/MainPageChat';
import styles from './MainPage.module.css';
import ModelPageCreateRoom from '../../components/ModelPageCreateRoom/ModelPageCreateRoom';
import ModelPageRedirectLobby from '../../components/ModelPageRedirectLobby/ModelPageRedirectLobby';
import { deleteRoom, editRoom } from '../../store/mainPage/mainPageSlice';

export function MainPage(): JSX.Element {
  const items = useAppSelector((state) => state.mainPage.items);
  const dispatch = useAppDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    const newTitle = prompt('Введите новое название комнаты:');
    if (newTitle) {
      dispatch(editRoom({ id, title: newTitle }));
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить эту комнату?')) {
      dispatch(deleteRoom(id));
    }
  };

  return (
    <>
      <MainPageChat />
      <h2>Доступные комнаты:</h2>
      {items.map((item) => (
        <ul key={item.id} className={styles.roomList}>
          <li
            className={styles.roomItem}
            onClick={() => {
              setSelectedRoomId(item.id);
              setIsRedirectModalOpen(true);
            }}
          >
            {item.title}
          </li>
          <button onClick={() => handleEdit(item.id)}>✏️</button>
          <button onClick={() => handleDelete(item.id)}>❌</button>
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
            <ModelPageRedirectLobby setIsModalOpen={setIsRedirectModalOpen} roomId={selectedRoomId} />
          </div>
        </div>
      )}
    </>
  );
}

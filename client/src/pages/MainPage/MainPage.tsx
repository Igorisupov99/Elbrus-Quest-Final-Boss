// src/pages/MainPage/MainPage.tsx
import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';

import MainPageChat from '../../components/MainPageChat/MainPageChat';
import ModelPageCreateRoom from '../../components/ModelPageCreateRoom/ModelPageCreateRoom';
import ModelPageRedirectLobby from '../../components/ModelPageRedirectLobby/ModelPageRedirectLobby';
import ModelPageEnterPassword from '../../components/ModelPageEnterPassword/ModelPageEnterPassword';

import styles from './MainPage.module.css';
import api from '../../lib/axios';
import { getAccessToken } from '../../lib/tokenStorage';
import { fetchRooms, updateRoom, removeRoom } from '../../store/mainPage/mainPageThunks';

type ModalKind = 'confirm' | 'password' | null;

export function MainPage(): JSX.Element {
  const { items, loading, error } = useAppSelector((s) => s.mainPage);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [modalKind, setModalKind] = useState<ModalKind>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    dispatch(fetchRooms());
  }, [dispatch]);

  const handleEdit = (id: number) => {
    const newTitle = prompt('Введите новое название комнаты:');
    if (newTitle) dispatch(updateRoom({ id, room_name: newTitle }));
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить эту комнату?')) dispatch(removeRoom(id));
  };

  async function handleRoomClick(id: number) {
    setSelectedRoomId(id);
    try {
      const { data } = await api.get(`/api/room/${id}/check-access`);
      if (data?.success && data?.data?.requiresPassword) {
        setModalKind('password');
      } else {
        setModalKind('confirm');
      }
      setIsAccessModalOpen(true);
    } catch {
      setIsAccessModalOpen(false);
      setModalKind(null);
    }
  }

  return (
    <>
      <MainPageChat />

      <h2 >Доступные комнаты:</h2>
      {loading && <p>Загрузка комнат...</p>}
      {error && <p className={styles.error}>Ошибка: {error}</p>}

      <ul className={styles.rooms}>
        {items.map((item) => (
          <li key={item.id} className={styles.roomRow}>
            <span className={styles.roomItem} onClick={() => handleRoomClick(item.id)}>
              {item.title}
            </span>
            <div className={styles.actions}>
              <button onClick={() => handleEdit(item.id)}>✏️</button>
              <button onClick={() => handleDelete(item.id)}>❌</button>
            </div>
          </li>
        ))}
      </ul>

      <button className={styles.createBtn} onClick={() => setIsCreateModalOpen(true)}>Создать комнату</button>

      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsCreateModalOpen(false)}>
              ×
            </button>
            <ModelPageCreateRoom setIsModalOpen={setIsCreateModalOpen} />
          </div>
        </div>
      )}

      {isAccessModalOpen && selectedRoomId !== null && (
        <div className={styles.modalOverlay} onClick={() => setIsAccessModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsAccessModalOpen(false)}>
              ×
            </button>

            {modalKind === 'confirm' && (
              <ModelPageRedirectLobby
                setIsModalOpen={setIsAccessModalOpen}
                roomId={selectedRoomId}
              />
            )}

            {modalKind === 'password' && (
              <ModelPageEnterPassword
                setIsModalOpen={setIsAccessModalOpen}
                roomId={selectedRoomId}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

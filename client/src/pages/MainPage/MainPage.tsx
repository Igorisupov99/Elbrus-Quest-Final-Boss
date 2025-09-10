// src/pages/MainPage/MainPage.tsx
import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';

import MainPageChat from '../../components/MainPageChat/MainPageChat';
import ModelPageCreateRoom from '../../components/ModelPageCreateRoom/ModelPageCreateRoom';
import ModelPageRedirectLobby from '../../components/ModelPageRedirectLobby/ModelPageRedirectLobby';
import ModelPageEnterPassword from '../../components/ModelPageEnterPassword/ModelPageEnterPassword';
import SuccessModal from '../../components/common/modals/SuccessModal/SuccessModal';
import EditRoomModal from '../../components/common/modals/EditRoomModal/EditRoomModal';
import DeleteRoomModal from '../../components/common/modals/DeleteRoomModal/DeleteRoomModal';
import { mainSocketClient } from '../../socket/socketMainPage';

import styles from './MainPage.module.css';
import api from '../../lib/axios';
import {
  fetchRooms,
  updateRoom,
  removeRoom,
} from '../../store/mainPage/mainPageThunks';
import { addRoom } from '../../store/mainPage/mainPageSlice';
import type { MainPageItem } from '../../types/mainPage';

type ModalKind = 'confirm' | 'password' | null;

export function MainPage(): JSX.Element {
  const { items, loading, error } = useAppSelector((s) => s.mainPage);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [modalKind, setModalKind] = useState<ModalKind>(null);

  // Success modal states
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    type: 'edit' | 'delete';
    title: string;
    message: string;
  } | null>(null);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    // if no user in state, redirect to login
    if (!userId) {
      navigate('/login');
      return;
    }

    dispatch(fetchRooms());

    // Connect to socket and set up room update listeners
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token available:', !!token);
    if (token) {
      try {
        console.log('🔌 Setting up socket connection...');
        mainSocketClient.connectWithToken(token);

        // Wait a moment for connection to establish
        setTimeout(() => {
          console.log(
            '🔍 Checking socket connection status:',
            mainSocketClient.isConnected
          );
          // Test the connection
          mainSocketClient.testConnection();
        }, 1000);

        // Create room update listener function
        const roomUpdateListener = (data: {
          event: string;
          data: MainPageItem;
        }) => {
          console.log('📡 Received room update:', data);
          const { event, data: roomData } = data;

          switch (event) {
            case 'created':
              console.log('➕ Adding new room:', roomData);
              dispatch(addRoom(roomData));
              break;
            case 'updated':
              console.log('🔄 Updating room:', roomData);
              dispatch(
                updateRoom.fulfilled(roomData, '', {
                  id: roomData.id,
                  room_name: roomData.title,
                })
              );
              break;
            case 'deleted':
              console.log('🗑️ Removing room:', roomData);
              dispatch(removeRoom.fulfilled(roomData.id, '', roomData.id));
              break;
            default:
              console.log('❓ Unknown room event:', event);
          }
        };

        // Set up the room update listener
        console.log('🎯 Setting up room update listener...');
        mainSocketClient.setupRoomUpdateListener(roomUpdateListener);

        // Cleanup on unmount
        return () => {
          console.log('🧹 Cleaning up socket listeners');
          mainSocketClient.removeRoomUpdateListener();
          mainSocketClient.disconnect();
        };
      } catch (error) {
        console.error('❌ Error setting up socket connection:', error);
      }
    }
  }, [dispatch, navigate, userId]);

  const handleEdit = (id: number, currentName: string) => {
    setEditingRoom({ id, name: currentName });
    setIsEditModalOpen(true);
  };

  const handleEditConfirm = async (newName: string) => {
    if (!editingRoom) return;

    try {
      const result = await dispatch(
        updateRoom({ id: editingRoom.id, room_name: newName })
      );
      if (updateRoom.fulfilled.match(result)) {
        setSuccessModalData({
          type: 'edit',
          title: 'Комната успешно изменена',
          message: `Название комнаты изменено на "${newName}"`,
        });
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('Error updating room:', error);
    } finally {
      setIsEditModalOpen(false);
      setEditingRoom(null);
    }
  };

  const handleDelete = (id: number, roomName: string) => {
    setDeletingRoom({ id, name: roomName });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRoom) return;

    try {
      const result = await dispatch(removeRoom(deletingRoom.id));
      if (removeRoom.fulfilled.match(result)) {
        setSuccessModalData({
          type: 'delete',
          title: 'Комната успешно удалена',
          message: 'Комната была удалена из списка',
        });
        setIsSuccessModalOpen(true);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingRoom(null);
    }
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
    <div className={styles.mainPage}>
      <div className={styles.mainContent}>
        <h2 className={styles.pageTitle}>🏰 Доступные комнаты</h2>
        {loading && <p className={styles.loading}>⚔️ Загрузка комнат...</p>}
        {error && <p className={styles.error}>❌ Ошибка: {error}</p>}

        <ul className={styles.rooms}>
          {items.map((item) => (
            <li
              key={item.id}
              className={styles.roomRow}
              onClick={() => handleRoomClick(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRoomClick(item.id);
                }
              }}
            >
              <span className={styles.roomItem}>
                {item.title}
                {item.room_code && (
                  <span
                    className={styles.lockIcon}
                    title="Комната защищена паролем"
                  >
                    🔒
                  </span>
                )}
              </span>

              {userId !== null && item.room_creator === userId && (
                <div className={styles.actions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item.id, item.title);
                    }}
                    title="Редактировать комнату"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.title);
                    }}
                    title="Удалить комнату"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <button
          className={styles.createBtn}
          onClick={() => setIsCreateModalOpen(true)}
        >
          ⚔️ Создать комнату
        </button>
      </div>

      <div className={styles.chatSidebar}>
        <MainPageChat />
      </div>

      {isCreateModalOpen && (
        <ModelPageCreateRoom setIsModalOpen={setIsCreateModalOpen} />
      )}

      {isAccessModalOpen && selectedRoomId !== null && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsAccessModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setIsAccessModalOpen(false)}
            >
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

      {/* Edit Room Modal */}
      {editingRoom && (
        <EditRoomModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRoom(null);
          }}
          onConfirm={handleEditConfirm}
          currentName={editingRoom.name}
          currentRoomId={editingRoom.id}
          existingRooms={items}
        />
      )}

      {/* Delete Room Modal */}
      {deletingRoom && (
        <DeleteRoomModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingRoom(null);
          }}
          onConfirm={handleDeleteConfirm}
          roomName={deletingRoom.name}
        />
      )}

      {/* Success Modal */}
      {successModalData && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setSuccessModalData(null);
          }}
          title={successModalData.title}
          message={successModalData.message}
          type={successModalData.type}
        />
      )}
    </div>
  );
}

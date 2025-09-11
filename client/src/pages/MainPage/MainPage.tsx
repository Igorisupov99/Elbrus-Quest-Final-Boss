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
import { AchievementNotification } from '../../components/Achievement/AchievementNotification/AchievementNotification';
import { mainSocketClient } from '../../socket/socketMainPage';

import styles from './MainPage.module.css';
import api from '../../lib/axios';
import {
  fetchRooms,
  updateRoom,
  removeRoom,
} from '../../store/mainPage/mainPageThunks';
import { addRoom } from '../../store/mainPage/mainPageSlice';
import type { MainPageItem, ModalKind } from '../../types/mainPage';
import type { Achievement } from '../../types/achievement';

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

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<
    'all' | 'public' | 'private'
  >('all');
  const [playerCountFilter, setPlayerCountFilter] = useState<{
    min: number;
    max: number;
  }>({ min: 0, max: 100 });
  const [minInputValue, setMinInputValue] = useState('');
  const [maxInputValue, setMaxInputValue] = useState('');

  // Achievement notification states
  const [achievementNotifications, setAchievementNotifications] = useState<Achievement[]>([]);

  const handleCloseAchievementNotification = () => {
    setAchievementNotifications([]);
  };

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

        // Set up achievement listener
        const achievementListener = (data: { userId: number; achievements: Achievement[] }) => {
          console.log('🏆 [MAIN] Received user:newAchievements:', data);
          const { userId: achievementUserId, achievements } = data;
          
          // Показываем уведомления только для текущего пользователя
          if (user && Number(achievementUserId) === Number(user.id)) {
            setAchievementNotifications(achievements);
          }
        };
        
        console.log('🏆 Setting up achievement listener...');
        mainSocketClient.setupAchievementListener(achievementListener);

        // Cleanup on unmount
        return () => {
          console.log('🧹 Cleaning up socket listeners');
          mainSocketClient.removeRoomUpdateListener();
          mainSocketClient.removeAchievementListener();
          mainSocketClient.disconnect();
        };
      } catch (error) {
        console.error('❌ Error setting up socket connection:', error);
      }
    }
  }, [dispatch, navigate, userId]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen) {
        const target = event.target as Element;
        if (!target.closest(`.${styles.filterContainer}`)) {
          setIsFilterOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Handle Enter key press in filter inputs
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setIsFilterOpen(false);
    }
  };

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

  // Filter rooms based on current filter states
  const filteredRooms = items.filter((room) => {
    // Filter by name
    if (
      nameFilter &&
      !room.title.toLowerCase().includes(nameFilter.toLowerCase())
    ) {
      return false;
    }

    // Filter by privacy
    if (privacyFilter === 'public' && room.room_code) {
      return false;
    }
    if (privacyFilter === 'private' && !room.room_code) {
      return false;
    }

    // Filter by player count (assuming we'll add this field later)
    const playerCount = 0; // Placeholder for now
    if (
      playerCount < playerCountFilter.min ||
      playerCount > playerCountFilter.max
    ) {
      return false;
    }

    return true;
  });

  // SVG Filter Icon Component
  const FilterIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 7H21M9 12H21M17 17H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="7" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="18" cy="17" r="2" fill="currentColor" />
    </svg>
  );

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
          {/* Filter Button positioned above first room */}
          <div className={styles.filterContainer}>
            <button
              className={styles.filterButton}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Фильтр
              <FilterIcon />
            </button>

            {isFilterOpen && (
              <div className={styles.filterDropdown}>
                <div className={styles.filterSection}>
                  <h3 className={styles.filterSectionTitle}>
                    🔍 Поиск по названию
                  </h3>
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите название комнаты..."
                    className={styles.filterInput}
                  />
                </div>

                <div className={styles.filterSection}>
                  <h3 className={styles.filterSectionTitle}>🔒 Приватность</h3>
                  <div className={styles.filterOptions}>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="privacy"
                        value="all"
                        checked={privacyFilter === 'all'}
                        onChange={(e) =>
                          setPrivacyFilter(
                            e.target.value as 'all' | 'public' | 'private'
                          )
                        }
                      />
                      <span>Все комнаты</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={privacyFilter === 'public'}
                        onChange={(e) =>
                          setPrivacyFilter(
                            e.target.value as 'all' | 'public' | 'private'
                          )
                        }
                      />
                      <span>Публичные</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={privacyFilter === 'private'}
                        onChange={(e) =>
                          setPrivacyFilter(
                            e.target.value as 'all' | 'public' | 'private'
                          )
                        }
                      />
                      <span>Приватные</span>
                    </label>
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h3 className={styles.filterSectionTitle}>
                    👥 Количество игроков
                  </h3>
                  <div className={styles.playerCountRange}>
                    <input
                      type="text"
                      value={minInputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setMinInputValue(value);
                          setPlayerCountFilter((prev) => ({
                            ...prev,
                            min: value === '' ? 0 : parseInt(value),
                          }));
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      className={styles.filterInput}
                      placeholder="Мин"
                    />
                    <span className={styles.rangeSeparator}>-</span>
                    <input
                      type="text"
                      value={maxInputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setMaxInputValue(value);
                          setPlayerCountFilter((prev) => ({
                            ...prev,
                            max: value === '' ? 100 : parseInt(value),
                          }));
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      className={styles.filterInput}
                      placeholder="Макс"
                    />
                  </div>
                </div>

                <div className={styles.filterActions}>
                  <button
                    onClick={() => {
                      setNameFilter('');
                      setPrivacyFilter('all');
                      setPlayerCountFilter({ min: 0, max: 100 });
                      setMinInputValue('');
                      setMaxInputValue('');
                    }}
                    className={styles.clearButton}
                  >
                    Очистить
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className={styles.applyButton}
                  >
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>
          {filteredRooms.map((item) => (
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

      {/* Achievement Notifications */}
      {achievementNotifications.length > 0 && (
        <AchievementNotification
          achievements={achievementNotifications}
          onClose={handleCloseAchievementNotification}
          autoCloseDelay={5000}
        />
      )}
    </div>
  );
}

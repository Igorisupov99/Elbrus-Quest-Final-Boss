import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import api from "../../api/axios";
import { 
  getFriends, 
  getIncomingRequests, 
  getOutgoingRequests,
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend,
  type User as FriendUser, 
  type Friendship 
} from "../../api/friendship/friendshipApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentAvatar } from "../../store/avatarSlice";
import { Link } from "react-router-dom";
import styles from "./Profile.module.css";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  score?: number;
  image_url?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function Profile() {
  const dispatch = useAppDispatch();
  const { currentAvatar } = useAppSelector((state) => state.avatar);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Для модального окна настроек
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Для друзей и заявок
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');

  // Для управления формой настроек
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // Загрузка данных профиля
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<User>>("/api/auth/profile", {
          withCredentials: true,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Ошибка при загрузке профиля");
        }

        setUser(response.data.data);

        // Инициализируем форму
        setFormData((f) => ({
          ...f,
          username: response.data.data.username,
          email: response.data.data.email,
        }));
      } catch (err) {
        let errorMessage = "Ошибка";
        if (axios.isAxiosError(err)) {
          errorMessage =
            err.response?.data?.message || err.message || "Ошибка";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
    
    // Загружаем данные аватара
    dispatch(fetchCurrentAvatar());
  }, [dispatch]);

  // Загрузка друзей и заявок
  useEffect(() => {
    const loadFriendsData = async () => {
      try {
        setFriendsLoading(true);
        setFriendsError(null);

        const [friendsResponse, incomingResponse, outgoingResponse] = await Promise.all([
          getFriends(),
          getIncomingRequests(),
          getOutgoingRequests()
        ]);

        if (friendsResponse.success) {
          setFriends(friendsResponse.data || []);
        }

        if (incomingResponse.success) {
          setIncomingRequests(incomingResponse.data || []);
        }

        if (outgoingResponse.success) {
          setOutgoingRequests(outgoingResponse.data || []);
        }

        if (!friendsResponse.success || !incomingResponse.success || !outgoingResponse.success) {
          setFriendsError('Ошибка при загрузке данных о друзьях');
        }
      } catch (err) {
        console.error('Ошибка при загрузке друзей:', err);
        setFriendsError('Ошибка при загрузке друзей');
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriendsData();
  }, []);

  // Обработчик открытия/закрытия модалки
  const openSettings = () => {
    setError(null); // очищаем ошибки при открытии модального окна
    setIsSettingsOpen(true);
  };
  const closeSettings = () => {
    setError(null); // очищаем ошибки при закрытии модального окна
    setIsSettingsOpen(false);
  };

  // Принять заявку на дружбу
  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      console.log('Принимаем заявку с ID:', friendshipId);
      const response = await acceptFriendRequest(friendshipId);
      console.log('Результат принятия заявки:', response);
      
      if (response.success) {
        // Обновляем списки
        console.log('Обновляем списки друзей и заявок...');
        const [friendsResponse, incomingResponse, outgoingResponse] = await Promise.all([
          getFriends(),
          getIncomingRequests(),
          getOutgoingRequests()
        ]);
        
        console.log('Новый список друзей:', friendsResponse);
        console.log('Новый список входящих заявок:', incomingResponse);
        console.log('Новый список исходящих заявок:', outgoingResponse);
        
        if (friendsResponse.success) setFriends(friendsResponse.data || []);
        if (incomingResponse.success) setIncomingRequests(incomingResponse.data || []);
        if (outgoingResponse.success) setOutgoingRequests(outgoingResponse.data || []);
        
        alert('Заявка на дружбу принята!');
      } else {
        console.error('Ошибка при принятии заявки:', response.message);
        alert(response.message || 'Ошибка при принятии заявки');
      }
    } catch (error) {
      console.error('Критическая ошибка при принятии заявки:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert(`Ошибка при принятии заявки: ${errorMessage}`);
    }
  };

  // Отклонить заявку на дружбу
  const handleRejectRequest = async (friendshipId: number) => {
    try {
      const response = await rejectFriendRequest(friendshipId);
      if (response.success) {
        // Обновляем список заявок
        const requestsResponse = await getIncomingRequests();
        if (requestsResponse.success) setIncomingRequests(requestsResponse.data || []);
        
        alert('Заявка на дружбу отклонена');
      } else {
        alert(response.message || 'Ошибка при отклонении заявки');
      }
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      alert('Ошибка при отклонении заявки');
    }
  };

  // Отменить исходящую заявку на дружбу
  const handleCancelRequest = async (friendshipId: number) => {
    try {
      const response = await rejectFriendRequest(friendshipId);
      if (response.success) {
        // Обновляем список исходящих заявок
        const outgoingResponse = await getOutgoingRequests();
        if (outgoingResponse.success) setOutgoingRequests(outgoingResponse.data || []);
        
        alert('Заявка на дружбу отменена');
      } else {
        alert(response.message || 'Ошибка при отмене заявки');
      }
    } catch (error) {
      console.error('Ошибка при отмене заявки:', error);
      alert('Ошибка при отмене заявки');
    }
  };

  // Удалить из друзей
  const handleRemoveFriend = async (friendId: number, friendName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ${friendName} из друзей?`)) {
      return;
    }

    try {
      const response = await removeFriend(friendId);
      if (response.success) {
        // Обновляем список друзей
        const friendsResponse = await getFriends();
        if (friendsResponse.success) setFriends(friendsResponse.data || []);
        
        alert(`${friendName} удален из друзей`);
      } else {
        alert(response.message || 'Ошибка при удалении из друзей');
      }
    } catch (error) {
      console.error('Ошибка при удалении из друзей:', error);
      alert('Ошибка при удалении из друзей');
    }
  };

  // Обработчик изменения полей формы
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обработчик отправки формы
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Отправляем данные на сервер для обновления профиля
      const response = await api.put<ApiResponse<User>>('/api/auth/update-profile', {
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined, // отправляем только если есть новый пароль
      }, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Ошибка при обновлении профиля");
      }

      // Обновляем локальное состояние пользователя с данными с сервера
      setUser(response.data.data);

      // Очищаем пароли из формы после успешного обновления
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        username: response.data.data.username,
        email: response.data.data.email,
      }));

      closeSettings();
      
      // Можно добавить уведомление об успешном обновлении
      alert("Профиль успешно обновлен!");
      
    } catch (err) {
      let errorMessage = "Ошибка при обновлении профиля";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления аккаунта
  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.")) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // вызов API для удаления аккаунта
      await api.delete("/api/auth/delete-account", { withCredentials: true });
      // например, редирект на страницу входа или главную
      window.location.href = "/register";
    } catch (err) {
      let errorMessage = "Ошибка удаления аккаунта";
      if (axios.isAxiosError(err)) {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка профиля...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;
  if (!user) return <div className={styles.notFound}>Пользователь не найден</div>;

  return (
<section className={styles.profileSection}>
  <h1 className={styles.header}>Профиль</h1>

  <div className={styles.profileContainer}>
    <div className={styles.avatarSection}>
      <img
        src={currentAvatar?.imageUrl || user.image_url || "/default-avatar.png"}
        alt="Аватар"
        className={styles.avatar}
      />
      {currentAvatar && (
        <div className={styles.avatarInfo}>
          <span className={styles.avatarName}>{currentAvatar.name}</span>
          <span className={styles.avatarRarity}>{currentAvatar.rarity}</span>
        </div>
      )}
    </div>

    <div className={styles.userInfo}>
      <h2>{user.username}</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Роль:</strong> {user.role || "Пользователь"}</p>
      <div className={styles.scoreInfo}>
        <span className={styles.scoreIcon}>⭐</span>
        <span className={styles.scoreAmount}>{user.score ?? 0}</span>
        <span className={styles.scoreLabel}>очков</span>
      </div>
      <Link to="/avatar-shop" className={styles.shopLink}>
        🎭 Магазин аватаров
      </Link>
    </div>
  </div>

  <button className={styles.settingsButton} onClick={openSettings}>
    Настройки профиля
  </button>

  {/* Секция друзей и заявок */}
  <div className={styles.friendsSection}>
    <div className={styles.tabsContainer}>
      <button 
        className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
        onClick={() => setActiveTab('friends')}
      >
        Друзья ({friends.length})
      </button>
      <button 
        className={`${styles.tab} ${activeTab === 'incoming' ? styles.activeTab : ''}`}
        onClick={() => setActiveTab('incoming')}
      >
        Входящие ({incomingRequests.length})
      </button>
      <button 
        className={`${styles.tab} ${activeTab === 'outgoing' ? styles.activeTab : ''}`}
        onClick={() => setActiveTab('outgoing')}
      >
        Исходящие ({outgoingRequests.length})
      </button>
    </div>

    {friendsLoading ? (
      <div className={styles.loading}>Загрузка...</div>
    ) : friendsError ? (
      <div className={styles.error}>Ошибка: {friendsError}</div>
    ) : (
      <div className={styles.tabContent}>
        {activeTab === 'friends' && (
          <div className={styles.friendsList}>
            {friends.length === 0 ? (
              <div className={styles.emptyMessage}>У вас еще нет друзей</div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className={styles.friendCard}>
                  <img
                    src={friend.image_url || "/default-avatar.png"}
                    alt={`Аватар ${friend.username}`}
                    className={styles.friendAvatar}
                  />
                  <div className={styles.friendInfo}>
                    <h4 className={styles.friendName}>{friend.username}</h4>
                    <p className={styles.friendEmail}>{friend.email}</p>
                    {friend.score !== undefined && (
                      <p className={styles.friendScore}>Очки: {friend.score}</p>
                    )}
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveFriend(friend.id, friend.username)}
                  >
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'incoming' && (
          <div className={styles.requestsList}>
            {incomingRequests.length === 0 ? (
              <div className={styles.emptyMessage}>Нет входящих заявок</div>
            ) : (
              incomingRequests.map((request) => (
                <div key={request.id} className={styles.requestCard}>
                  <img
                    src={request.user?.image_url || "/default-avatar.png"}
                    alt={`Аватар ${request.user?.username}`}
                    className={styles.friendAvatar}
                  />
                  <div className={styles.friendInfo}>
                    <h4 className={styles.friendName}>{request.user?.username}</h4>
                    <p className={styles.friendEmail}>{request.user?.email}</p>
                    {request.user?.score !== undefined && (
                      <p className={styles.friendScore}>Очки: {request.user.score}</p>
                    )}
                  </div>
                  <div className={styles.requestButtons}>
                    <button
                      className={styles.acceptButton}
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Принять
                    </button>
                    <button
                      className={styles.rejectButton}
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className={styles.requestsList}>
            {outgoingRequests.length === 0 ? (
              <div className={styles.emptyMessage}>Нет исходящих заявок</div>
            ) : (
              outgoingRequests.map((request) => (
                <div key={request.id} className={styles.requestCard}>
                  <img
                    src={request.friend?.image_url || "/default-avatar.png"}
                    alt={`Аватар ${request.friend?.username}`}
                    className={styles.friendAvatar}
                  />
                  <div className={styles.friendInfo}>
                    <h4 className={styles.friendName}>{request.friend?.username}</h4>
                    <p className={styles.friendEmail}>{request.friend?.email}</p>
                    {request.friend?.score !== undefined && (
                      <p className={styles.friendScore}>Очки: {request.friend.score}</p>
                    )}
                  </div>
                  <div className={styles.requestButtons}>
                    <button
                      className={styles.rejectButton}
                      onClick={() => handleCancelRequest(request.id)}
                    >
                      Отменить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )}
  </div>

      {/* Модальное окно */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={closeSettings}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()} // чтобы клик по содержимому не закрывал модал
          >
            <button className={styles.closeBtn} onClick={closeSettings} aria-label="Закрыть модальное окно">
              &times;
            </button>
            <h2 className={styles.modalHeader}>Настройки профиля</h2>

            {error && (
              <div className={styles.error} style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Логин</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Текущий пароль *</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Введите текущий пароль для подтверждения изменений"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль (оставьте пустым, если не хотите менять)</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Введите новый пароль или оставьте пустым"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.button} ${styles.saveBtn}`}>
                  Сохранить изменения
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.deleteBtn}`}
                  onClick={handleDelete}
                >
                  Удалить аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
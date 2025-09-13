import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";
import { 
  checkFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getIncomingRequests,
  getOutgoingRequests,
  type User as FriendUser,
  type Friendship, 
} from "../../api/friendship/friendshipApi";
import { getFriendsCountText } from "../../utils/declination";
import { AchievementCard } from "../../components/Achievement/AchievementCard/AchievementCard";
import { AchievementModal } from "../../components/Achievement/AchievementModal/AchievementModal";
import { FavoriteQuestionModal } from "../../components/FavoriteQuestionModal/FavoriteQuestionModal";
import { UserAvatar } from "../../components/common/UserAvatar";
import type { Achievement } from "../../types/achievement";
import type { FavoriteQuestion } from "../../types/favorite";
import { useAppSelector } from "../../store/hooks";
import styles from "../ProfilePage/Profile.module.css";

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

export function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Для друзей
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [currentFriendsIndex, setCurrentFriendsIndex] = useState<number>(0);
  
  // Для статуса дружбы
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked' | 'loading'>('loading');
  const [incomingRequest, setIncomingRequest] = useState<Friendship | null>(null);
  const [outgoingRequest, setOutgoingRequest] = useState<Friendship | null>(null);

  // Для достижений
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState<boolean>(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState<number>(0);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState<boolean>(false);

  // Для избранных вопросов
  const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestion[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);
  const [currentFavoriteIndex, setCurrentFavoriteIndex] = useState<number>(0);
  const [selectedQuestion, setSelectedQuestion] = useState<FavoriteQuestion | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);


  // Загрузка данных профиля пользователя
  useEffect(() => {
    if (!userId) {
      setError("ID пользователя не найден");
      setLoading(false);
      return;
    }

    // Проверяем, не пытается ли пользователь зайти на свой собственный профиль
    if (currentUser && currentUser.id.toString() === userId) {
      navigate('/profile');
      return;
    }

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<User>>(`/api/auth/user/id/${userId}`, {
          withCredentials: true,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Ошибка при загрузке профиля");
        }

        setUser(response.data.data);
      } catch (err) {
        let errorMessage = "Ошибка при загрузке профиля";
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

    loadUserProfile();
  }, [userId, currentUser, navigate]);

  // Загрузка друзей пользователя
  useEffect(() => {
    if (!user?.id) return;

    const loadUserFriends = async () => {
      try {
        setFriendsLoading(true);
        
        // Получаем друзей конкретного пользователя
        const response = await api.get<ApiResponse<FriendUser[]>>(`/api/friendship/user/${user.id}/friends`, {
          withCredentials: true,
        });

        if (response.data.success) {
          setFriends(response.data.data || []);
        }
      } catch (err) {
        console.error('Ошибка при загрузке друзей пользователя:', err);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadUserFriends();
  }, [user?.id]);

  // Проверка статуса дружбы и заявок
  useEffect(() => {
    if (!user?.id) return;

    const checkStatus = async () => {
      try {
        setFriendshipStatus('loading');
        setIncomingRequest(null);
        setOutgoingRequest(null);
        
        // Проверяем общий статус дружбы
        const statusResponse = await checkFriendshipStatus(user.id);
        
        if (statusResponse.success && statusResponse.data) {
          setFriendshipStatus(statusResponse.data.status);
        } else {
          setFriendshipStatus('none');
        }

        // Если статус pending, проверяем входящие и исходящие заявки
        if (statusResponse.success && statusResponse.data?.status === 'pending') {
          // Проверяем входящие заявки
          const incomingResponse = await getIncomingRequests();
          if (incomingResponse.success && incomingResponse.data) {
            const foundIncomingRequest = incomingResponse.data.find(
              (request: Friendship) => request.user?.id === user.id
            );
            setIncomingRequest(foundIncomingRequest || null);
          }

          // Проверяем исходящие заявки
          const outgoingResponse = await getOutgoingRequests();
          if (outgoingResponse.success && outgoingResponse.data) {
            const foundOutgoingRequest = outgoingResponse.data.find(
              (request: Friendship) => request.friend?.id === user.id
            );
            setOutgoingRequest(foundOutgoingRequest || null);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке статуса дружбы:', error);
        setFriendshipStatus('none');
      }
    };

    checkStatus();
  }, [user?.id]);

  // Загрузка достижений пользователя
  useEffect(() => {
    if (!user?.id) return;

    const loadUserAchievements = async () => {
      setAchievementsLoading(true);
      try {
        // Получаем достижения конкретного пользователя
        const response = await api.get<ApiResponse<{ achievements: Achievement[] }>>(`/api/achievement/user/${user.id}`, {
          withCredentials: true,
        });

        if (response.data.success && response.data.data.achievements) {
          // Если это уже массив достижений, используем их напрямую
          const earnedAchievements = response.data.data.achievements.map(achievement => ({
            ...achievement,
            earned: true,
            earned_at: achievement.earned_at || new Date().toISOString()
          }));
          setAchievements(earnedAchievements);
        } else {
          setAchievements([]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке достижений пользователя:', error);
        setAchievements([]);
      } finally {
        setAchievementsLoading(false);
      }
    };

    loadUserAchievements();
  }, [user?.id]);

  // Загрузка избранных вопросов пользователя (публичных)
  useEffect(() => {
    if (!user?.id) return;

    const loadUserFavorites = async () => {
      setFavoritesLoading(true);
      try {
        // Получаем публичные избранные вопросы пользователя
        const response = await api.get<ApiResponse<{ favorites: FavoriteQuestion[] }>>(`/api/favorites/user/${user.id}`, {
          withCredentials: true,
        });

        if (response.data.success && response.data.data.favorites) {
          setFavoriteQuestions(response.data.data.favorites.slice(0, 15));
        } else {
          setFavoriteQuestions([]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке избранных вопросов пользователя:', error);
        setFavoriteQuestions([]);
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadUserFavorites();
  }, [user?.id]);

  // Функции для карусели достижений
  const nextAchievements = () => {
    if (achievements.length > 3) {
      setCurrentAchievementIndex((prev) => 
        prev + 3 >= achievements.length ? 0 : prev + 3
      );
    }
  };

  const prevAchievements = () => {
    if (achievements.length > 3) {
      setCurrentAchievementIndex((prev) => 
        prev - 3 < 0 ? Math.max(0, achievements.length - 3) : prev - 3
      );
    }
  };

  const getVisibleAchievements = () => {
    return achievements.slice(currentAchievementIndex, currentAchievementIndex + 3);
  };

  // Обработчики для модального окна достижений
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsAchievementModalOpen(true);
  };

  const handleCloseAchievementModal = () => {
    setIsAchievementModalOpen(false);
    setSelectedAchievement(null);
  };

  // Обработчики для модального окна вопросов
  const handleQuestionClick = (question: FavoriteQuestion) => {
    setSelectedQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setSelectedQuestion(null);
  };

  // Функции для карусели избранных вопросов
  const nextFavorites = () => {
    if (favoriteQuestions.length > 5) {
      setCurrentFavoriteIndex((prev) => 
        prev + 5 >= favoriteQuestions.length ? 0 : prev + 5
      );
    }
  };

  const prevFavorites = () => {
    if (favoriteQuestions.length > 5) {
      setCurrentFavoriteIndex((prev) => 
        prev - 5 < 0 ? Math.max(0, favoriteQuestions.length - 5) : prev - 5
      );
    }
  };

  const getVisibleFavorites = () => {
    return favoriteQuestions.slice(currentFavoriteIndex, currentFavoriteIndex + 5);
  };

  // Функции для карусели друзей
  const nextFriends = () => {
    if (friends.length > 5) {
      setCurrentFriendsIndex((prev) => 
        prev + 5 >= friends.length ? 0 : prev + 5
      );
    }
  };

  const prevFriends = () => {
    if (friends.length > 5) {
      setCurrentFriendsIndex((prev) => 
        prev - 5 < 0 ? Math.max(0, friends.length - 5) : prev - 5
      );
    }
  };

  const getVisibleFriends = () => {
    return friends.slice(currentFriendsIndex, currentFriendsIndex + 5);
  };

  // Отправить заявку на дружбу
  const handleSendFriendRequest = async () => {
    if (!user?.id) return;

    try {
      const response = await sendFriendRequest(user.id);
      
      if (response.success) {
        setFriendshipStatus('pending');
        alert(`Заявка на дружбу отправлена пользователю ${user.username}`);
      } else {
        alert(response.message || 'Ошибка при отправке заявки на дружбу');
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки на дружбу:', error);
      alert('Ошибка при отправке заявки на дружбу');
    }
  };

  // Принять заявку на дружбу
  const handleAcceptRequest = async () => {
    if (!incomingRequest?.id) return;

    try {
      const response = await acceptFriendRequest(incomingRequest.id);
      
      if (response.success) {
        setFriendshipStatus('accepted');
        setIncomingRequest(null);
        alert(`Заявка на дружбу от ${user?.username} принята!`);
      } else {
        alert(response.message || 'Ошибка при принятии заявки');
      }
    } catch (error) {
      console.error('Ошибка при принятии заявки:', error);
      alert('Ошибка при принятии заявки');
    }
  };

  // Отклонить заявку на дружбу
  const handleRejectRequest = async () => {
    if (!incomingRequest?.id) return;

    try {
      const response = await rejectFriendRequest(incomingRequest.id);
      
      if (response.success) {
        setFriendshipStatus('none');
        setIncomingRequest(null);
        alert(`Заявка на дружбу от ${user?.username} отклонена`);
      } else {
        alert(response.message || 'Ошибка при отклонении заявки');
      }
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      alert('Ошибка при отклонении заявки');
    }
  };

  // Удалить из друзей
  const handleRemoveFriend = async () => {
    if (!user?.id) return;

    if (!confirm(`Вы уверены, что хотите удалить ${user.username} из друзей?`)) {
      return;
    }

    try {
      const response = await removeFriend(user.id);
      
      if (response.success) {
        setFriendshipStatus('none');
        setIncomingRequest(null);
        setOutgoingRequest(null);
        alert(`${user.username} удален из друзей`);
      } else {
        alert(response.message || 'Ошибка при удалении из друзей');
      }
    } catch (error) {
      console.error('Ошибка при удалении из друзей:', error);
      alert('Ошибка при удалении из друзей');
    }
  };

  // Переход на страницу друга
  const handleFriendClick = (friendId: number) => {
    navigate(`/user/${friendId}`);
  };

  if (loading) return <div className={styles.loading}>Загрузка профиля...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;
  if (!user) return <div className={styles.notFound}>Пользователь не найден</div>;

  return (
    <section className={styles.profileSection}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            appearance: 'none',
            padding: '8px 16px',
            background: 'linear-gradient(180deg, #d4a017, #a97400)',
            color: '#2c1810',
            border: '2px solid #6b3e15',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
            textShadow: '0 1px 0 #f3e0c0',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #f0c33b, #c48a00)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #d4a017, #a97400)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.2)';
          }}
        >
          ← Назад
        </button>
        <h1 className={styles.header}>Профиль пользователя</h1>
      </div>

      <div className={styles.mainContainer}>
        {/* Левый блок (2/3 ширины) */}
        <div className={styles.leftBlock}>
          
          {/* Блок 1.1 - Основная информация */}
          <div className={styles.profileInfoBlock}>
            <div className={styles.avatarSection}>
              <UserAvatar
                userId={user.id}
                fallbackImageUrl={user.image_url || "/default-avatar.svg"}
                size="large"
                alt="Аватар"
                className={styles.avatar}
              />
              
              {/* Кнопки управления дружбой */}
              {friendshipStatus === 'none' && (
                <button 
                  className={styles.editButton}
                  onClick={handleSendFriendRequest}
                  style={{
                    background: 'linear-gradient(180deg, #d4a017, #a97400)',
                    borderColor: '#6b3e15'
                  }}
                >
                  Добавить в друзья
                </button>
              )}
              
              {friendshipStatus === 'pending' && incomingRequest && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#8b4513', 
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>
                    Входящая заявка на дружбу
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className={styles.editButton}
                      onClick={handleAcceptRequest}
                      style={{
                        background: 'linear-gradient(180deg, #d4a017, #a97400)',
                        borderColor: '#6b3e15',
                        padding: '8px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      ✅ Принять
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={handleRejectRequest}
                      style={{
                        background: 'linear-gradient(180deg, #dc3545, #c82333)',
                        borderColor: '#b21e2f',
                        padding: '8px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              )}
              
              {friendshipStatus === 'pending' && !incomingRequest && outgoingRequest && (
                <div 
                  className={styles.editButton}
                  style={{
                    background: 'linear-gradient(180deg, #d4a017, #a97400)',
                    borderColor: '#6b3e15',
                    cursor: 'default'
                  }}
                >
                  Заявка отправлена
                </div>
              )}

              {friendshipStatus === 'pending' && !incomingRequest && !outgoingRequest && (
                <div 
                  className={styles.editButton}
                  style={{
                    background: 'linear-gradient(180deg, #d4a017, #a97400)',
                    borderColor: '#6b3e15',
                    cursor: 'default'
                  }}
                >
                  Заявка отправлена
                </div>
              )}
              
              {friendshipStatus === 'accepted' && (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
                  <div 
                    className={styles.editButton}
                    style={{
                      background: 'linear-gradient(180deg, #d4a017, #a97400)',
                      borderColor: '#6b3e15',
                      cursor: 'default',
                      padding: '8px 16px',
                      fontSize: '0.9rem'
                    }}
                  >
                    ✓ В друзьях
                  </div>
                  <button
                    className={styles.editButton}
                    onClick={handleRemoveFriend}
                    style={{
                      background: 'linear-gradient(135deg, #dc3545, #c82333)',
                      borderColor: '#b21e2f',
                      padding: '8px 16px',
                      fontSize: '0.9rem'
                    }}
                  >
                    🗑️ Удалить из друзей
                  </button>
                </div>
              )}
            </div>
            <div className={styles.basicInfo}>
              <h2 className={styles.username}>{user.username}</h2>
              <p className={styles.friendsCount}>{getFriendsCountText(friends.length)}</p>
            </div>
          </div>

          {/* Блок 1.2 - Статистика */}
          <div className={styles.statisticsBlock}>
            <h3 className={styles.blockTitle}>Статистика</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{user.score ?? 0}</div>
                <div className={styles.statLabel}>Очки</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>0</div>
                <div className={styles.statLabel}>Игры</div>
              </div>
            </div>
          </div>

          {/* Блок достижений */}
          <div className={styles.achievementsBlock}>
            <div className={styles.achievementsHeader}>
              <h3 className={styles.blockTitle}>Достижения</h3>
              {achievements.length > 3 && (
                <div className={styles.carouselControls}>
                  <button 
                    className={styles.carouselButton}
                    onClick={prevAchievements}
                    aria-label="Предыдущие достижения"
                  >
                    ←
                  </button>
                  <button 
                    className={styles.carouselButton}
                    onClick={nextAchievements}
                    aria-label="Следующие достижения"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.achievementsCarousel}>
              {achievementsLoading ? (
                <div className={styles.loading}>Загрузка достижений...</div>
              ) : achievements.length === 0 ? (
                <div className={styles.emptyMessage}>У пользователя пока нет достижений</div>
              ) : (
                <div className={styles.achievementsList}>
                  {getVisibleAchievements().map((achievement) => (
                    <div key={achievement.id} className={styles.achievementWrapper}>
                      <AchievementCard 
                        achievement={achievement}
                        className={styles.profileAchievementCard}
                        onClick={handleAchievementClick}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {achievements.length > 0 && (
              <div className={styles.achievementsIndicator}>
                {achievements.length > 3 ? `${currentAchievementIndex + 1}-${Math.min(currentAchievementIndex + 3, achievements.length)} из ${achievements.length}` : `${achievements.length} достижени${achievements.length === 1 ? 'е' : achievements.length < 5 ? 'я' : 'й'}`}
              </div>
            )}
          </div>
        </div>

        {/* Правый блок (1/3 ширины) */}
        <div className={styles.rightBlock}>
          
          {/* Секция друзей */}
          <div className={styles.friendsSection}>
            <h3 className={styles.blockTitle}>Друзья</h3>
            
            {friendsLoading ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : (
              <>
                {/* Информация о количестве друзей с кнопками карусели */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    marginBottom: '20px',
                    background: 'linear-gradient(180deg, #f5deb3, #fff8dc)',
                    color: '#4b2e05',
                    borderRadius: '8px',
                    border: '2px solid #8b5a2b',
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    textShadow: '0 1px 0 #f3e0c0'
                  }}
                >
                  {friends.length > 5 && (
                    <button 
                      onClick={prevFriends}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid #2c1810',
                        background: 'rgba(44, 24, 16, 0.1)',
                        color: '#2c1810',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(44, 24, 16, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(44, 24, 16, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ←
                    </button>
                  )}
                  
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    👥 {getFriendsCountText(friends.length)}
                  </div>
                  
                  {friends.length > 5 && (
                    <button 
                      onClick={nextFriends}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid #2c1810',
                        background: 'rgba(44, 24, 16, 0.1)',
                        color: '#2c1810',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(44, 24, 16, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(44, 24, 16, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      →
                    </button>
                  )}
                </div>
                
                <div className={styles.friendsList}>
                  {friends.length === 0 ? (
                    <div className={styles.emptyMessage}>У пользователя еще нет друзей</div>
                  ) : (
                    getVisibleFriends().map((friend) => (
                      <div 
                        key={friend.id} 
                        className={styles.friendCard}
                        onClick={() => handleFriendClick(friend.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '18px',
                          background: 'linear-gradient(180deg, #f5deb3, #fff8dc)',
                          borderRadius: '12px',
                          border: '2px solid #8b5a2b',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = '#8b5a2b';
                          e.currentTarget.style.background = '#fff8dc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          e.currentTarget.style.borderColor = '#6b3e15';
                          e.currentTarget.style.background = 'linear-gradient(180deg, #f5deb3, #fff8dc)';
                        }}
                      >
                        {/* Декоративная полоска сверху */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #d4a017, #a97400)'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                          <UserAvatar
                            userId={friend.id}
                            fallbackImageUrl={friend.image_url || "/default-avatar.svg"}
                            size="medium"
                            shape="square"
                            alt={`Аватар ${friend.username}`}
                            className={styles.friendAvatar}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <h4 className={styles.friendName}>{friend.username}</h4>
                            <p className={styles.friendScore}>
                              🏆 {friend.score ?? 0} очков
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Индикатор карусели друзей */}
                {friends.length > 0 && (
                  <div 
                    style={{
                      textAlign: 'center',
                      marginTop: '16px',
                      fontSize: '0.9rem',
                      color: '#8b7355',
                      fontWeight: '500'
                    }}
                  >
                    {friends.length > 5 ? 
                      `${currentFriendsIndex + 1}-${Math.min(currentFriendsIndex + 5, friends.length)} из ${friends.length}` : 
                      getFriendsCountText(friends.length)
                    }
                  </div>
                )}
              </>
            )}
          </div>

          {/* Секция избранных вопросов */}
          <div className={styles.favoriteQuestionsSection}>
            <div className={styles.favoritesHeader}>
              <h3 className={styles.blockTitle}>Избранные вопросы</h3>
              {favoriteQuestions.length > 5 && (
                <div className={styles.carouselControls}>
                  <button 
                    className={styles.carouselButton}
                    onClick={prevFavorites}
                    aria-label="Предыдущие вопросы"
                  >
                    ↑
                  </button>
                  <button 
                    className={styles.carouselButton}
                    onClick={nextFavorites}
                    aria-label="Следующие вопросы"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.favoritesCarousel}>
              {favoritesLoading ? (
                <div className={styles.loading}>Загрузка избранных вопросов...</div>
              ) : favoriteQuestions.length === 0 ? (
                <div className={styles.emptyMessage}>У пользователя нет публичных избранных вопросов</div>
              ) : (
                <div className={styles.questionsList}>
                  {getVisibleFavorites().map((favorite) => (
                    <div 
                      key={favorite.id} 
                      className={styles.questionCard}
                      onClick={() => handleQuestionClick(favorite)}
                    >
                      <div className={styles.questionHeader}>
                        <span className={styles.topicBadge}>
                          {favorite.question.topic.title}
                        </span>
                        <span className={styles.phaseInfo}>
                          Фаза {favorite.question.topic.phaseId}
                        </span>
                      </div>
                      
                      <div className={styles.questionContent}>
                        <p className={styles.questionText}>
                          {favorite.question.text}
                        </p>
                        
                        <div className={styles.questionMeta}>
                          <span className={styles.questionType}>
                            {favorite.question.questionType}
                          </span>
                          <span className={styles.addedDate}>
                            {new Date(favorite.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {favoriteQuestions.length > 0 && (
              <div className={styles.favoritesIndicator}>
                {favoriteQuestions.length > 5 ? `${currentFavoriteIndex + 1}-${Math.min(currentFavoriteIndex + 5, favoriteQuestions.length)} из ${favoriteQuestions.length}` : `${favoriteQuestions.length} вопрос${favoriteQuestions.length === 1 ? '' : favoriteQuestions.length < 5 ? 'а' : 'ов'}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для достижений */}
      <AchievementModal
        achievement={selectedAchievement}
        isOpen={isAchievementModalOpen}
        onClose={handleCloseAchievementModal}
        earnedDate={selectedAchievement?.earned_at}
      />

      {/* Модальное окно для избранных вопросов */}
      <FavoriteQuestionModal
        question={selectedQuestion}
        isOpen={isQuestionModalOpen}
        onClose={handleCloseQuestionModal}
      />

    </section>
  );
}

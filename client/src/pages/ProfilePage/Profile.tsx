import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import axios from "axios";
import api from "../../api/axios";
import { 
  getFriends, 
  getIncomingRequests, 
  getOutgoingRequests,
  acceptFriendRequest, 
  rejectFriendRequest,
  removeFriend,
  getUserByUsername,
  sendFriendRequest,
  type User as FriendUser, 
  type Friendship 
} from "../../api/friendship/friendshipApi";
import { getFriendsCountText } from "../../utils/declination";
import { achievementApi } from "../../api/achievements/achievementApi";
import { AchievementCard } from "../../components/Achievement/AchievementCard/AchievementCard";
import { AchievementModal } from "../../components/Achievement/AchievementModal/AchievementModal";
import { FavoriteQuestionModal } from "../../components/FavoriteQuestionModal/FavoriteQuestionModal";
import { UserAvatar } from "../../components/common/UserAvatar";
import type { Achievement } from "../../types/achievement";
import { favoriteApi } from "../../api/favorites/favoriteApi";
import type { FavoriteQuestion } from "../../types/favorite";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentAvatar } from "../../store/avatarSlice";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
  const [currentFriendsIndex, setCurrentFriendsIndex] = useState<number>(0);
  
  // Для модальных окон заявок
  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [isOutgoingModalOpen, setIsOutgoingModalOpen] = useState(false);

  // Для поиска друзей
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<FriendUser | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');


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

  // Redux для аватаров
  const dispatch = useAppDispatch();
  const currentAvatar = useAppSelector(state => state.avatar.currentAvatar);



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
  }, []);

  // Загрузка друзей и заявок
  useEffect(() => {
    const loadFriendsData = async () => {
      try {
        setFriendsLoading(true);

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
      } catch (err) {
        console.error('Ошибка при загрузке друзей:', err);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriendsData();
  }, []);

  // Загрузка достижений
  useEffect(() => {
    const loadAchievements = async () => {
      setAchievementsLoading(true);
      try {
        // Сначала пытаемся загрузить пользовательские достижения
        try {
          const userData = await achievementApi.getUserAchievements();
          // Фильтруем только полученные достижения
          const earnedAchievements = userData.achievements
            .filter(ua => ua.achievement)
            .map(ua => ({
              ...ua.achievement,
              earned: true,
              earned_at: ua.earned_at
            }));
          setAchievements(earnedAchievements);
        } catch {
          // Если пользователь не авторизован, показываем все достижения
          const allData = await achievementApi.getAllAchievements();
          setAchievements(allData.achievements.slice(0, 6)); // Показываем первые 6
        }
      } catch (error) {
        console.error('Ошибка при загрузке достижений:', error);
        setAchievements([]);
      } finally {
        setAchievementsLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Загрузка избранных вопросов
  useEffect(() => {
    const loadFavorites = async () => {
      setFavoritesLoading(true);
      try {
        const response = await favoriteApi.getUserFavorites({ 
          page: 1, 
          limit: 15 // Загружаем 15 вопросов для карусели
        });
        setFavoriteQuestions(response.favorites || []);
      } catch (error) {
        console.error('Ошибка при загрузке избранных вопросов:', error);
        setFavoriteQuestions([]);
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Загрузка текущего аватара
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCurrentAvatar());
    }
  }, [dispatch, user?.id]);

  // Обработчик открытия/закрытия модалки
  const openSettings = () => {
    setError(null); // очищаем ошибки при открытии модального окна
    setIsSettingsOpen(true);
  };
  const closeSettings = () => {
    setError(null); // очищаем ошибки при закрытии модального окна
    setIsSettingsOpen(false);
  };

  // Функции для модальных окон заявок
  const openIncomingModal = () => setIsIncomingModalOpen(true);
  const closeIncomingModal = () => setIsIncomingModalOpen(false);
  const openOutgoingModal = () => setIsOutgoingModalOpen(true);
  const closeOutgoingModal = () => setIsOutgoingModalOpen(false);


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
    if (favoriteQuestions.length > 3) {
      setCurrentFavoriteIndex((prev) => 
        prev + 3 >= favoriteQuestions.length ? 0 : prev + 3
      );
    }
  };

  const prevFavorites = () => {
    if (favoriteQuestions.length > 3) {
      setCurrentFavoriteIndex((prev) => 
        prev - 3 < 0 ? Math.max(0, favoriteQuestions.length - 3) : prev - 3
      );
    }
  };

  const getVisibleFavorites = () => {
    return favoriteQuestions.slice(currentFavoriteIndex, currentFavoriteIndex + 3);
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


  // Принять заявку на дружбу
  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      const response = await acceptFriendRequest(friendshipId);
      
      if (response.success) {
        // Обновляем списки
        const [friendsResponse, incomingResponse] = await Promise.all([
          getFriends(),
          getIncomingRequests()
        ]);
        
        if (friendsResponse.success) setFriends(friendsResponse.data || []);
        if (incomingResponse.success) setIncomingRequests(incomingResponse.data || []);
        
        alert('Заявка на дружбу принята!');
      } else {
        alert(response.message || 'Ошибка при принятии заявки');
      }
    } catch (error) {
      console.error('Ошибка при принятии заявки:', error);
      alert('Ошибка при принятии заявки');
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

  // Поиск пользователя по логину
  const handleSearchUser = async (username: string) => {
    if (!username.trim()) {
      setSearchResult(null);
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    
    try {
      const response = await getUserByUsername(username.trim());
      
      if (response.success && response.data) {
        setSearchResult(response.data);
      } else {
        setSearchResult(null);
        setSearchError(response.message || 'Пользователь не найден');
      }
    } catch (error) {
      console.error('Ошибка при поиске пользователя:', error);
      setSearchResult(null);
      setSearchError('Ошибка при поиске пользователя');
    } finally {
      setSearchLoading(false);
    }
  };

  // Отправить заявку на дружбу
  const handleSendFriendRequest = async (friendId: number, friendName: string) => {
    try {
      const response = await sendFriendRequest(friendId);
      
      if (response.success) {
        // Обновляем список исходящих заявок
        const outgoingResponse = await getOutgoingRequests();
        if (outgoingResponse.success) setOutgoingRequests(outgoingResponse.data || []);
        
        // Очищаем результат поиска
        setSearchResult(null);
        setSearchQuery('');
        
        alert(`Заявка на дружбу отправлена пользователю ${friendName}`);
      } else {
        alert(response.message || 'Ошибка при отправке заявки на дружбу');
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки на дружбу:', error);
      alert('Ошибка при отправке заявки на дружбу');
    }
  };

  // Обработчик изменения поискового запроса
  const handleSearchQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // Дебаунс поиска с useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchUser(searchQuery);
      } else {
        setSearchResult(null);
        setSearchError('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Проверяем, является ли пользователь уже другом или есть ли заявка
  const getFriendshipStatus = (userId: number) => {
    // Проверяем, есть ли пользователь в списке друзей
    if (friends.some(friend => friend.id === userId)) {
      return 'friend';
    }
    
    // Проверяем исходящие заявки
    if (outgoingRequests.some(request => request.friend?.id === userId)) {
      return 'pending_outgoing';
    }
    
    // Проверяем входящие заявки
    if (incomingRequests.some(request => request.user?.id === userId)) {
      return 'pending_incoming';
    }
    
    return 'none';
  };

  // Переход на страницу друга
  const handleFriendClick = (friendId: number) => {
    navigate(`/user/${friendId}`);
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

  <div className={styles.mainContainer}>
    {/* Левый блок (2/3 ширины) */}
    <div className={styles.leftBlock}>
      
      {/* Блок 1.1 - Основная информация */}
      <div className={styles.profileInfoBlock}>
        <div className={styles.avatarSection} style={{ position: 'relative' }}>
          <Link 
            to="/avatar-shop" 
            className={styles.avatarShopLink}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              zIndex: 10,
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #d8a35d, #b0752d)',
              color: '#2c1810',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              border: '2px solid #8b5a2b',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              textShadow: '0 1px 0 #f3e0c0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #e8b76d, #c6853d)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #d8a35d, #b0752d)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
            }}
          >
            🛒 Магазин аватаров
          </Link>
          
          <img
            src={currentAvatar?.imageUrl || user.image_url || "/default-avatar.svg"}
            alt="Аватар"
            className={styles.avatar}
          />
          
          <button className={styles.editButton} onClick={openSettings}>
            Редактировать
          </button>
        </div>
        <div className={styles.basicInfo}>
          <h2 className={styles.username}>{user.username}</h2>
          <p className={styles.friendsCount}>{getFriendsCountText(friends.length)}</p>
        </div>
      </div>

      {/* Блок 1.2 - Достижения */}
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
            <div className={styles.emptyMessage}>У вас пока нет достижений</div>
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

      {/* Блок избранных вопросов */}
      <div className={styles.favoriteQuestionsSection}>
          <div className={styles.favoritesHeader}>
            <h3 className={styles.blockTitle}>Избранные вопросы</h3>
            {favoriteQuestions.length > 3 && (
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
            <div className={styles.emptyMessage}>У вас нет избранных вопросов</div>
          ) : (
            <div className={styles.questionsList}>
              {getVisibleFavorites().map((favorite, index) => (
                <div 
                  key={`favorite-${favorite.id}-${favorite.question.id}-${index}`} 
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
            {favoriteQuestions.length > 3 ? `${currentFavoriteIndex + 1}-${Math.min(currentFavoriteIndex + 3, favoriteQuestions.length)} из ${favoriteQuestions.length}` : `${favoriteQuestions.length} вопрос${favoriteQuestions.length === 1 ? '' : favoriteQuestions.length < 5 ? 'а' : 'ов'}`}
          </div>
        )}
      </div>
    </div>

    {/* Правый блок (1/3 ширины) */}
    <div className={styles.rightBlock}>
      
      {/* Секция статистики */}
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

      {/* Секция друзей */}
      <div className={styles.friendsSection}>
        <h3 className={styles.blockTitle}>Друзья</h3>
        
        {friendsLoading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <>
            <div 
              className={styles.friendsActions}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
                padding: '16px',
                border: '2px solid #6b3e15',
                borderRadius: '12px',
                background: '#fffaf0',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <button 
                className={styles.requestButton}
                onClick={openIncomingModal}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #d8a35d, #b0752d)',
                  color: '#2c1810',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  textShadow: '0 1px 0 #f3e0c0',
                  border: '2px solid #8b5a2b',
                  padding: '1px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e8b76d, #c6853d)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #d8a35d, #b0752d)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Входящие заявки ({incomingRequests.length})
              </button>
              <button 
                className={styles.requestButton}
                onClick={openOutgoingModal}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #d8a35d, #b0752d)',
                  color: '#2c1810',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  textShadow: '0 1px 0 #f3e0c0',
                  border: '2px solid #8b5a2b',
                  padding: '1px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e8b76d, #c6853d)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #d8a35d, #b0752d)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Отправленные заявки ({outgoingRequests.length})
              </button>
            </div>
            
            {/* Более выразительная информация о количестве друзей с кнопками карусели */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #d8a35d, #b0752d)',
                color: '#2c1810',
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
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'rgba(44, 24, 16, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'rgba(44, 24, 16, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ←
                </button>
              )}
              
              <div style={{ textAlign: 'center', flex: 1 }}>
                👥 У вас {getFriendsCountText(friends.length)}
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
                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'rgba(44, 24, 16, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'rgba(44, 24, 16, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  →
                </button>
              )}
            </div>

            {/* Поиск друзей */}
            <div 
              style={{
                padding: '10px',
                marginBottom: '10px',
                background: '#fffaf0',
                borderRadius: '6px',
                border: '2px solid #6b3e15',
                boxShadow: '0 1px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 
                style={{
                  margin: '0 0 8px 0',
                  color: '#2c1810',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  textAlign: 'center'
                }}
              >
                🔍 Найти друга
              </h4>
              
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  placeholder="Введите логин пользователя..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '2px solid #d8a35d',
                    borderRadius: '5px',
                    fontSize: '0.85rem',
                    background: '#fff',
                    color: '#2c1810',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                    e.currentTarget.style.borderColor = '#b0752d';
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(176, 117, 45, 0.3)';
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    e.currentTarget.style.borderColor = '#d8a35d';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                
                {searchLoading && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#b0752d',
                      fontSize: '14px'
                    }}
                  >
                    ⏳
                  </div>
                )}
              </div>

              {/* Результат поиска */}
              {searchError && (
                <div 
                  style={{
                    padding: '6px',
                    background: '#ffe6e6',
                    border: '1px solid #ff9999',
                    borderRadius: '4px',
                    color: '#cc0000',
                    fontSize: '0.8rem',
                    textAlign: 'center'
                  }}
                >
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div 
                  style={{
                    padding: '8px',
                    background: '#f0f8ff',
                    border: '1px solid #87ceeb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => navigate(`/user/${searchResult.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e6f3ff';
                    e.currentTarget.style.borderColor = '#5dade2';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f8ff';
                    e.currentTarget.style.borderColor = '#87ceeb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <UserAvatar
                    userId={searchResult.id}
                    fallbackImageUrl={searchResult.image_url || "/default-avatar.svg"}
                    size="small"
                    shape="square"
                    alt={`Аватар ${searchResult.username}`}
                    style={{
                      border: '1px solid #87ceeb',
                      flexShrink: 0
                    }}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <h5 
                      style={{
                        margin: '0 0 1px 0',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#2c1810',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {searchResult.username}
                      <span style={{ fontSize: '0.7rem', color: '#666' }}>👆</span>
                    </h5>
                    {searchResult.score !== undefined && (
                      <p 
                        style={{
                          margin: '0',
                          fontSize: '0.75rem',
                          color: '#666'
                        }}
                      >
                        Очки: {searchResult.score}
                      </p>
                    )}
                  </div>

                  {(() => {
                    const status = getFriendshipStatus(searchResult.id);
                    
                    if (searchResult.id === user?.id) {
                      return (
                        <div 
                          style={{
                            padding: '4px 8px',
                            background: '#e0e0e0',
                            borderRadius: '4px',
                            color: '#666',
                            fontSize: '0.75rem'
                          }}
                        >
                          Это вы
                        </div>
                      );
                    }
                    
                    if (status === 'friend') {
                      return (
                        <div 
                          style={{
                            padding: '4px 8px',
                            background: '#d4edda',
                            border: '1px solid #28a745',
                            borderRadius: '4px',
                            color: '#155724',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ✅ Уже друг
                        </div>
                      );
                    }
                    
                    if (status === 'pending_outgoing') {
                      return (
                        <div 
                          style={{
                            padding: '4px 8px',
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '4px',
                            color: '#856404',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ⏳ Заявка отправлена
                        </div>
                      );
                    }
                    
                    if (status === 'pending_incoming') {
                      return (
                        <div 
                          style={{
                            padding: '4px 8px',
                            background: '#cce5ff',
                            border: '1px solid #007bff',
                            borderRadius: '4px',
                            color: '#004085',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          📨 Есть заявка от вас
                        </div>
                      );
                    }
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Предотвращаем всплытие события
                          handleSendFriendRequest(searchResult.id, searchResult.username);
                        }}
                        style={{
                          padding: '6px 10px',
                          background: 'linear-gradient(135deg, #28a745, #20c997)',
                          color: 'white',
                          border: '1px solid #1e7e34',
                          borderRadius: '5px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)'
                        }}
                        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #218838, #17a2b8)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 5px 12px rgba(40, 167, 69, 0.4)';
                        }}
                        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 3px 8px rgba(40, 167, 69, 0.3)';
                        }}
                      >
                        ➕ Добавить в друзья
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className={styles.friendsList}>
              {friends.length === 0 ? (
                <div className={styles.emptyMessage}>У вас еще нет друзей</div>
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
                      background: '#fffaf0',
                      borderRadius: '12px',
                      border: '3px solid #6b3e15',
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
                      e.currentTarget.style.background = '#fffaf0';
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
                        background: 'linear-gradient(90deg, #d8a35d, #b0752d)'
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
                    <button
                      className={styles.removeFriendButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend.id, friend.username);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                        color: 'white',
                        border: '2px solid #b21e2f',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        boxShadow: '0 3px 8px rgba(220, 53, 69, 0.3)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 5px 12px rgba(220, 53, 69, 0.4)';
                        e.currentTarget.style.borderColor = '#a71e2a';
                      }}
                      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(220, 53, 69, 0.3)';
                        e.currentTarget.style.borderColor = '#b21e2f';
                      }}
                      onMouseDown={(e: MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'translateY(1px)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.4)';
                      }}
                      onMouseUp={(e: MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 5px 12px rgba(220, 53, 69, 0.4)';
                      }}
                    >
                      🗑️
                    </button>
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
    </div>
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
              <div className={styles.errorWithMargin}>
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

      {/* Модальное окно входящих заявок */}
      {isIncomingModalOpen && (
        <div className={styles.modalOverlay} onClick={closeIncomingModal}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #fffaf0 0%, #fff8dc 100%)',
              border: '3px solid #d8a35d',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(216, 163, 93, 0.2)',
              position: 'relative'
            }}
          >
            {/* Декоративная полоска сверху */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #8b4513, #a0522d, #cd853f)',
                borderRadius: '16px 16px 0 0'
              }}
            />
            
            <button 
              className={styles.closeBtn} 
              onClick={closeIncomingModal} 
              aria-label="Закрыть модальное окно"
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                width: '35px',
                height: '35px',
                border: 'none',
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                borderRadius: '50%',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 8px rgba(220, 53, 69, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(220, 53, 69, 0.4)';
              }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
              }}
            >
              ×
            </button>
            
            <div style={{ padding: '25px 30px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '25px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid #d8a35d'
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b4513, #a0522d)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)'
                  }}
                >
                  📨
                </div>
                <div>
                  <h2 
                    style={{
                      margin: '0',
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      color: '#2c1810',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Входящие заявки
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '1.1rem',
                      color: '#8b4513',
                      fontWeight: '600'
                    }}
                  >
                    {incomingRequests.length} {incomingRequests.length === 1 ? 'заявка' : incomingRequests.length < 5 ? 'заявки' : 'заявок'}
                  </p>
                </div>
              </div>
              
              <div 
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}
              >
                {incomingRequests.length === 0 ? (
                  <div 
                    style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#8b7355',
                      fontSize: '1.2rem',
                      fontStyle: 'italic'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    Нет входящих заявок
                  </div>
                ) : (
                  incomingRequests.map((request, index) => (
                    <div 
                      key={`incoming-${request.id}-${index}`} 
                      onClick={() => {
                        if (request.user?.id) {
                          closeIncomingModal();
                          navigate(`/user/${request.user.id}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '20px',
                        marginBottom: '16px',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '2px solid #e9ecef',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.borderColor = '#8b4513';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }}
                    >
                      {/* Декоративная полоска слева */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: 'linear-gradient(180deg, #8b4513, #a0522d)'
                        }}
                      />
                      
                      <UserAvatar
                        userId={request.user?.id || 0}
                        fallbackImageUrl={request.user?.image_url || "/default-avatar.svg"}
                        size="medium"
                        shape="square"
                        alt={`Аватар ${request.user?.username}`}
                        style={{
                          border: '3px solid #8b4513',
                          boxShadow: '0 4px 8px rgba(139, 69, 19, 0.2)',
                          flexShrink: 0
                        }}
                      />
                      
                      <div style={{ flex: 1 }}>
                        <h4 
                          style={{
                            margin: '0 0 6px 0',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: '#2c1810'
                          }}
                        >
                          {request.user?.username}
                        </h4>
                        {request.user?.email && (
                          <p 
                            style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.9rem',
                              color: '#6c757d'
                            }}
                          >
                            📧 {request.user.email}
                          </p>
                        )}
                        {request.user?.score !== undefined && (
                          <p 
                            style={{
                              margin: '0',
                              fontSize: '1rem',
                              color: '#d8a35d',
                              fontWeight: '600'
                            }}
                          >
                            🏆 Очки: {request.user.score}
                          </p>
                        )}
                      </div>
                      
                      <div 
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          flexShrink: 0
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptRequest(request.id);
                          }}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #8b4513, #a0522d)',
                            color: 'white',
                            border: '2px solid #654321',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 3px 8px rgba(139, 69, 19, 0.3)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                          }}
                          onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #a0522d, #cd853f)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 69, 19, 0.4)';
                          }}
                          onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #8b4513, #a0522d)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 3px 8px rgba(139, 69, 19, 0.3)';
                          }}
                        >
                          ✅ Принять
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectRequest(request.id);
                          }}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #dc3545, #c82333)',
                            color: 'white',
                            border: '2px solid #b21e2f',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 3px 8px rgba(220, 53, 69, 0.3)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                          }}
                          onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(220, 53, 69, 0.4)';
                          }}
                          onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 3px 8px rgba(220, 53, 69, 0.3)';
                          }}
                        >
                          ❌ Отклонить
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно исходящих заявок */}
      {isOutgoingModalOpen && (
        <div className={styles.modalOverlay} onClick={closeOutgoingModal}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #fffaf0 0%, #fff8dc 100%)',
              border: '3px solid #d8a35d',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(216, 163, 93, 0.2)',
              position: 'relative'
            }}
          >
            {/* Декоративная полоска сверху */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #d2691e, #cd853f, #daa520)',
                borderRadius: '16px 16px 0 0'
              }}
            />
            
            <button 
              className={styles.closeBtn} 
              onClick={closeOutgoingModal} 
              aria-label="Закрыть модальное окно"
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                width: '35px',
                height: '35px',
                border: 'none',
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                borderRadius: '50%',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 8px rgba(220, 53, 69, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(220, 53, 69, 0.4)';
              }}
              onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
              }}
            >
              ×
            </button>
            
            <div style={{ padding: '25px 30px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '25px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid #d8a35d'
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(210, 105, 30, 0.3)'
                  }}
                >
                  📤
                </div>
                <div>
                  <h2 
                    style={{
                      margin: '0',
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      color: '#2c1810',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Отправленные заявки
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '1.1rem',
                      color: '#d2691e',
                      fontWeight: '600'
                    }}
                  >
                    {outgoingRequests.length} {outgoingRequests.length === 1 ? 'заявка' : outgoingRequests.length < 5 ? 'заявки' : 'заявок'}
                  </p>
                </div>
              </div>
              
              <div 
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}
              >
                {outgoingRequests.length === 0 ? (
                  <div 
                    style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#8b7355',
                      fontSize: '1.2rem',
                      fontStyle: 'italic'
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📪</div>
                    Нет отправленных заявок
                  </div>
                ) : (
                  outgoingRequests.map((request, index) => (
                    <div 
                      key={`outgoing-${request.id}-${index}`} 
                      onClick={() => {
                        if (request.friend?.id) {
                          closeOutgoingModal();
                          navigate(`/user/${request.friend.id}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '20px',
                        marginBottom: '16px',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '2px solid #e9ecef',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.borderColor = '#d2691e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }}
                    >
                      {/* Декоративная полоска слева */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: 'linear-gradient(180deg, #d2691e, #cd853f)'
                        }}
                      />
                      
                      <UserAvatar
                        userId={request.friend?.id || 0}
                        fallbackImageUrl={request.friend?.image_url || "/default-avatar.svg"}
                        size="medium"
                        shape="square"
                        alt={`Аватар ${request.friend?.username}`}
                        style={{
                          border: '3px solid #d2691e',
                          boxShadow: '0 4px 8px rgba(210, 105, 30, 0.2)',
                          flexShrink: 0
                        }}
                      />
                      
                      <div style={{ flex: 1 }}>
                        <h4 
                          style={{
                            margin: '0 0 6px 0',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: '#2c1810'
                          }}
                        >
                          {request.friend?.username}
                        </h4>
                        {request.friend?.email && (
                          <p 
                            style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.9rem',
                              color: '#6c757d'
                            }}
                          >
                            📧 {request.friend.email}
                          </p>
                        )}
                        {request.friend?.score !== undefined && (
                          <p 
                            style={{
                              margin: '0',
                              fontSize: '1rem',
                              color: '#d8a35d',
                              fontWeight: '600'
                            }}
                          >
                            🏆 Очки: {request.friend.score}
                          </p>
                        )}
                      </div>
                      
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #f4e4bc, #f0d89e)',
                          border: '2px solid #d2691e',
                          borderRadius: '20px',
                          color: '#8b4513',
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          boxShadow: '0 3px 8px rgba(210, 105, 30, 0.2)',
                          flexShrink: 0,
                          minWidth: '140px'
                        }}
                      >
                        <span style={{ marginRight: '8px', fontSize: '16px' }}>⏳</span>
                        Ожидает ответа
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
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
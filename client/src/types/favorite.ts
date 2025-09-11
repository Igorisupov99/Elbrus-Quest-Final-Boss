export interface FavoriteQuestion {
  id: number;
  questionId: number;
  question: {
    id: number;
    text: string;
    correctAnswer: string;
    questionType: string;
    mentorTip: string;
    topic: {
      id: number;
      title: string;
      phaseId: number;
    };
  };
  createdAt: string;
}

export interface FavoritesState {
  favorites: FavoriteQuestion[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
}

export interface FavoriteButtonState {
  isFavorite: boolean;
  loading: boolean;
  error: string | null;
}

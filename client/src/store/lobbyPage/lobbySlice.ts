import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type POIStatus = "available" | "locked" | "completed";

export interface LobbyUser {
  id: number;
  username: string;
}

export interface LobbyPoint {
  id: string;
  title: string;
  top: number;
  left: number;
  status: POIStatus;
  phaseId: number;
  topicId: number;
}

export interface ExamQuestion {
  id: number;
  question_text: string;
  topic_title: string;
}

interface LobbyModal {
  isOpen: boolean;
  questionId: number | null;
  topic: string;
  question: string;
  mentor_tip?: string;
}

interface LobbyState {
  users: LobbyUser[];
  activePlayerId: number | null;
  points: LobbyPoint[];
  modal: LobbyModal;
  examModalOpen: boolean;
  examQuestions: ExamQuestion[];
  examIndex: number;
  examRestoring: boolean;
  activeExamId: string | null;
  scores: {
    userScore: number;
    sessionScore: number;
    incorrectAnswers: number;
  };
  modalResult: string | null;
  phaseTransitionModal: {
    isOpen: boolean;
    phaseNumber: number;
    rewardPoints: number;
  };
  examFailureModal: {
    isOpen: boolean;
    correctAnswers: number;
    totalQuestions: number;
    successRate: number;
    phaseId: number;
  };
  reconnectWaitingModal: {
    isOpen: boolean;
    activePlayerName: string;
    timeLeft: number;
  };
  correctAnswerNotification: {
    isOpen: boolean;
    points: number;
  };
}

export const initialState: LobbyState = {
  users: [],
  activePlayerId: null,
  points: [
    {
      id: "1",
      title: "Тема 1",
      top: 49,
      left: 38,
      status: "available",
      phaseId: 1,
      topicId: 1
    },
    {
      id: "2",
      title: "Тема 2",
      top: 56,
      left: 35,
      status: "available",
      phaseId: 1,
      topicId: 2
    },
    {
      id: "3",
      title: "Тема 3",
      top: 62,
      left: 26.5,
      status: "available",
      phaseId: 1,
      topicId: 3
    },
    {
      id: "4",
      title: "Тема 4",
      top: 69,
      left: 33,
      status: "available",
      phaseId: 1,
      topicId: 4
    },
    {
      id: "exam",
      title: "Экзамен",
      top: 77,
      left: 32.8,
      status: "locked",
      phaseId: 1,
      topicId: 0
    },
    // Фаза 2 — четыре точки и экзамен 2 (изначально заблокированы)
    {
      id: "5",
      title: "Тема 5",
      top: 83,
      left: 24,
      status: "locked",
      phaseId: 2,
      topicId: 6
    },
    {
      id: "6",
      title: "Тема 6",
      top: 90.5,
      left: 30,
      status: "locked",
      phaseId: 2,
      topicId: 7
    },
    {
      id: "7",
      title: "Тема 7",
      top: 95.47,
      left: 42,
      status: "locked",
      phaseId: 2,
      topicId: 8
    },
    {
      id: "8",
      title: "Тема 8",
      top: 95.4,
      left: 57,
      status: "locked",
      phaseId: 2,
      topicId: 9
    },
    {
      id: "exam2",
      title: "Экзамен 2",
      top: 87,
      left: 56.44,
      status: "locked",
      phaseId: 2,
      topicId: 0
    }
  ],
  modal: {
    isOpen: false,
    questionId: null,
    topic: "",
    question: "",
  },
  examModalOpen: false,
  examQuestions: [],
  examIndex: 0,
  examRestoring: false,
  activeExamId: null,
  modalResult: null,
  scores: { userScore: 0, sessionScore: 0, incorrectAnswers: 0},
  phaseTransitionModal: {
    isOpen: false,
    phaseNumber: 1,
    rewardPoints: 0,
  },
  examFailureModal: {
    isOpen: false,
    correctAnswers: 0,
    totalQuestions: 0,
    successRate: 0,
    phaseId: 1,
  },
  reconnectWaitingModal: {
    isOpen: false,
    activePlayerName: '',
    timeLeft: 30,
  },
  correctAnswerNotification: {
    isOpen: false,
    points: 10,
  },
};

const lobbyPageReducer = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setUsers(
      state,
      action: PayloadAction<{ users: LobbyUser[]; activePlayerId: number | null }>
    ) {
      state.users = action.payload.users;
      state.activePlayerId = action.payload.activePlayerId;
    },
    setPoints(state, action: PayloadAction<LobbyPoint[]>) {
      state.points = action.payload;
    },
    updatePointStatus(
      state,
      action: PayloadAction<{ pointId: string; status: POIStatus }>
    ) {
      const point = state.points.find((p) => p.id === action.payload.pointId);
      if (point) point.status = action.payload.status;
    },
    openModal(
      state,
      action: PayloadAction<{ questionId: number; topic: string; question: string; mentor_tip?: string }>
    ) {
      state.modal = { isOpen: true, ...action.payload };
    },
    closeModal(state) {
      state.modal = { isOpen: false, questionId: null, topic: "", question: "", mentor_tip: undefined };
    },
    openExamModal(state) {
      state.examModalOpen = true;
    },
    closeExamModal(state) {
      state.examModalOpen = false;
    },
    setExamQuestions(state, action: PayloadAction<ExamQuestion[]>) {
      state.examQuestions = action.payload;
    },
    clearExamQuestions(state) {
      state.examQuestions = [];
    },
    setExamIndex(state, action: PayloadAction<number>) {
      state.examIndex = action.payload;
    },
    setModalResult(state, action: PayloadAction<string | null>) {
      state.modalResult = action.payload;
    },
    setScores(
      state,
      action: PayloadAction<{ userScore: number; sessionScore: number; incorrectAnswers: number }>
    ) {
      state.scores = action.payload;
    },
    mergeScores(
      state,
      action: PayloadAction<Partial<{ userScore: number; sessionScore: number; incorrectAnswers: number }>>
    ) {
      state.scores = {
        ...state.scores,
        ...action.payload,
      };
    },
    incrementIncorrectAnswers(state) {
      state.scores.incorrectAnswers += 1;
    },
    setIncorrectAnswers(state, action: PayloadAction<number>) {
      state.scores.incorrectAnswers = action.payload;
    },
    openPhaseTransitionModal(
      state,
      action: PayloadAction<{ phaseNumber: number; rewardPoints: number }>
    ) {
      state.phaseTransitionModal = {
        isOpen: true,
        phaseNumber: action.payload.phaseNumber,
        rewardPoints: action.payload.rewardPoints,
      };
    },
    closePhaseTransitionModal(state) {
      state.phaseTransitionModal.isOpen = false;
    },
    openExamFailureModal(
      state,
      action: PayloadAction<{ correctAnswers: number; totalQuestions: number; successRate: number; phaseId: number }>
    ) {
      state.examFailureModal = {
        isOpen: true,
        correctAnswers: action.payload.correctAnswers,
        totalQuestions: action.payload.totalQuestions,
        successRate: action.payload.successRate,
        phaseId: action.payload.phaseId,
      };
    },
    closeExamFailureModal(state) {
      state.examFailureModal.isOpen = false;
    },
    openReconnectWaitingModal(
      state,
      action: PayloadAction<{ activePlayerName: string; timeLeft: number }>
    ) {
      state.reconnectWaitingModal = {
        isOpen: true,
        activePlayerName: action.payload.activePlayerName,
        timeLeft: action.payload.timeLeft,
      };
    },
    closeReconnectWaitingModal(state) {
      state.reconnectWaitingModal.isOpen = false;
    },
    updateReconnectTimer(state, action: PayloadAction<number>) {
      state.reconnectWaitingModal.timeLeft = action.payload;
    },
    setExamRestoring(state, action: PayloadAction<boolean>) {
      state.examRestoring = action.payload;
    },
    openCorrectAnswerNotification(
      state,
      action: PayloadAction<{ points: number }>
    ) {
      state.correctAnswerNotification = {
        isOpen: true,
        points: action.payload.points,
      };
    },
    closeCorrectAnswerNotification(state) {
      state.correctAnswerNotification.isOpen = false;
    },
    setActiveExamId(state, action: PayloadAction<string | null>) {
      console.log(`🔍 [REDUX] Изменяем activeExamId: ${state.activeExamId} -> ${action.payload}`);
      state.activeExamId = action.payload;
    }
  },
});

export const { setUsers, setPoints, updatePointStatus, openModal, closeModal, openExamModal, closeExamModal, setExamQuestions, clearExamQuestions, setExamIndex, setScores, mergeScores, incrementIncorrectAnswers, setIncorrectAnswers, setModalResult, openPhaseTransitionModal, closePhaseTransitionModal, openExamFailureModal, closeExamFailureModal, openReconnectWaitingModal, closeReconnectWaitingModal, updateReconnectTimer, setExamRestoring, openCorrectAnswerNotification, closeCorrectAnswerNotification, setActiveExamId } =
  lobbyPageReducer.actions;

export default lobbyPageReducer.reducer;

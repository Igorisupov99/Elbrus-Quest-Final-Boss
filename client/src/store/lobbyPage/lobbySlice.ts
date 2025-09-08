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

interface LobbyModal {
  isOpen: boolean;
  questionId: number | null;
  topic: string;
  question: string;
}

interface LobbyState {
  users: LobbyUser[];
  activePlayerId: number | null;
  points: LobbyPoint[];
  modal: LobbyModal;
  scores: {
    userScore: number;
    sessionScore: number;
    incorrectAnswers: number;
  };
}

export const initialState: LobbyState = {
  users: [],
  activePlayerId: null,
  points: [
    {
      id: "1",
      title: "Тема 1",
      top: 81,
      left: 32.3,
      status: "available",
      phaseId: 1,
      topicId: 1
    },
    {
      id: "2",
      title: "Тема 2",
      top: 70.5,
      left: 32,
      status: "available",
      phaseId: 1,
      topicId: 2
    },
    {
      id: "3",
      title: "Тема 3",
      top: 65,
      left: 26.5,
      status: "available",
      phaseId: 1,
      topicId: 3
    },
    {
      id: "4",
      title: "Тема 4",
      top: 55,
      left: 36,
      status: "available",
      phaseId: 1,
      topicId: 4
    },
    {
      id: "exam",
      title: "Экзамен",
      top: 90,
      left: 24,
      status: "locked",
      phaseId: 1,
      topicId: 0
    }
  ],
  modal: {
    isOpen: false,
    questionId: null,
    topic: "",
    question: "",
  },
  scores: { userScore: 0, sessionScore: 0, incorrectAnswers: 0},
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
      action: PayloadAction<{ questionId: number; topic: string; question: string }>
    ) {
      state.modal = { isOpen: true, ...action.payload };
    },
    closeModal(state) {
      state.modal = { isOpen: false, questionId: null, topic: "", question: "" };
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
    }
  },
});

export const { setUsers, setPoints, updatePointStatus, openModal, closeModal, setScores, mergeScores, incrementIncorrectAnswers, setIncorrectAnswers } =
  lobbyPageReducer.actions;

export default lobbyPageReducer.reducer;

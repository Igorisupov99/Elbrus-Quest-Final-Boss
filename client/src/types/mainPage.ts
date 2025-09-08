export interface MainPageItem {
  id: number;
  title: string;
  room_creator: number;
  isCreator: boolean;
}

export interface MainPageState {
  items: MainPageItem[];
  loading: boolean;
  error: string | null;
}

export interface CheckCreatorResponse {
  map(arg0: (el: any) => import("react/jsx-runtime").JSX.Element): unknown;
  success: boolean;
  data: {
    id: string;
    room_name: string;
    room_creator: number | null;
  } | null;
}

export interface CheckCreatorState {
  response: CheckCreatorResponse | null;
  onLoading: boolean;
  error: string | null;
}

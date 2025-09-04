import type { JSX } from "react";
import { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import MainPageChat from "../../components/MainPageChat/MainPageChat";
import styles from "./MainPage.module.css";
import ModelPageCreateRoom from "../../components/ModelPageCreateRoom/ModelPageCreateRoom";
import ModelPageRedirectLobby from "../../components/ModelPageRedirectLobby/ModelPageRedirectLobby";

export function MainPage(): JSX.Element {
  const items = useAppSelector((state) => state.mainPage.items);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  return (
    <div className={styles.mainPage}>
      {/* Левая колонка — комнаты */}
      <div className={styles.leftColumn}>
        <h2 className={styles.sectionTitle}>Доступные комнаты</h2>
        <ul className={styles.roomList}>
          {items.map((item) => (
            <li
              key={item.id}
              className={styles.roomItem}
              onClick={() => {
                setSelectedRoomId(item.id);
                setIsRedirectModalOpen(true);
              }}
            >
              {item.title}
            </li>
          ))}
        </ul>
        <button
          className={styles.createRoomBtn}
          onClick={() => setIsModalOpen(true)}
        >
          Создать комнату
        </button>
      </div>

      {/* Правая колонка — чат */}
      <div className={styles.rightColumn}>
        <h2 className={styles.sectionTitle}>Общий чат</h2>
        <div className={styles.chatWrapper}>
          <MainPageChat />
        </div>
      </div>

      {/* Modal for creating a room */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <ModelPageCreateRoom setIsModalOpen={setIsModalOpen} />
          </div>
        </div>
      )}

      {/* Modal for redirecting to lobby */}
      {isRedirectModalOpen && selectedRoomId !== null && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsRedirectModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setIsRedirectModalOpen(false)}
            >
              ×
            </button>
            <ModelPageRedirectLobby
              setIsModalOpen={setIsRedirectModalOpen}
              roomId={selectedRoomId}
            />
          </div>
        </div>
      )}
    </div>
  );
}

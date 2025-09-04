import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ModelPageRedirectLobby.module.css';

interface Props {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  roomId: number;
}

function ModelPageRedirectLobby({ setIsModalOpen, roomId }: Props) {
  const navigate = useNavigate();

  const handleYes = () => {
    setIsModalOpen(false); 
    navigate(`/lobby/${roomId}`)  };

  const handleNo = () => {
    setIsModalOpen(false); 
  };

  return (
    <div className={styles.modalBox}>
      <h3>Войти в комнату?</h3>
      <div className={styles.buttons}>
        <button onClick={handleYes}>Да</button>
        <button onClick={handleNo}>Нет</button>
      </div>
    </div>
  );
}

export default ModelPageRedirectLobby;

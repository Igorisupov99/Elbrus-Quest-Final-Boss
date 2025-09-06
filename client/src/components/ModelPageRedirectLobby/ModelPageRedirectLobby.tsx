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
    <div className={styles.container}>
      <h3 className={styles.title}>Войти в комнату?</h3>
      <div className={styles.buttons}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleYes}>Да</button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleNo}>Нет</button>
      </div>
    </div>
  );
}

export default ModelPageRedirectLobby;




import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import styles from './ModelPageEnterPassword.module.css';

interface Props {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  roomId: number;
}

export default function ModelPageEnterPassword({ setIsModalOpen, roomId }: Props) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!code || code.trim().length < 5) {
      setErr('Минимум 5 символов');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post(`/api/room/${roomId}/verify`, { code });

      if (data?.success) {
        setIsModalOpen(false);
        navigate(`/lobby/${roomId}`);
      } else {
        setErr(data?.message || 'Неверный пароль');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modalBox}>
      <h3>Комната защищена паролем</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Введите пароль"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {err && <p className={styles.error}>{err}</p>}
        <div className={styles.buttons}>
          <button type="submit" disabled={loading}>
            Войти
          </button>
          <button type="button" onClick={() => setIsModalOpen(false)}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

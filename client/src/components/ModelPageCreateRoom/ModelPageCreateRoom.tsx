// ModelPageCreateRoom.tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createRoom } from '../../store/mainPage/mainPageThunks';
import { useNavigate } from 'react-router-dom';
import styles from './ModelPageCreateRoom.module.css';

interface FormInputs {
  roomName: string;
  password: string;
}

interface ModelPageCreateRoomProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create schema function that takes existing rooms as parameter
const createSchema = (existingRooms: { title: string }[]) =>
  yup.object({
    roomName: yup
      .string()
      .required('Название комнаты обязательно')
      .min(5, 'Минимум 5 символов')
      .max(30, 'Максимум 30 символов')
      .test(
        'unique-name',
        'Комната с таким названием уже существует',
        function (value) {
          if (!value) return true; // Let required validation handle empty values

          // Trim whitespace and check if any existing room has the same name (case-insensitive)
          const trimmedValue = value.trim();
          const isDuplicate = existingRooms.some(
            (room) => room.title.toLowerCase() === trimmedValue.toLowerCase()
          );

          return !isDuplicate;
        }
      ),
    password: yup
      .string()
      .nullable()
      .notRequired()
      .min(5, 'Минимум 5 символов')
      .transform((value) => (value === '' ? null : value)),
  });

export default function ModelPageCreateRoom({
  setIsModalOpen,
}: ModelPageCreateRoomProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Get existing rooms from Redux store
  const existingRooms = useAppSelector((state) => state.mainPage.items);

  // Create schema with existing rooms
  const schema = createSchema(existingRooms);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInputs>({
    // @ts-expect-error: yupResolver type mismatch with dynamic schema
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormInputs) => {
    try {
      const result = await dispatch(
        createRoom({ roomName: data.roomName, password: data.password })
      );

      if (createRoom.fulfilled.match(result)) {
        // Room created successfully, navigate to the new room
        navigate(`/lobby/${result.payload.id}`);
        setIsModalOpen(false);
        reset();
      } else {
        // Handle error case
        console.error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeBtn}
          onClick={() => setIsModalOpen(false)}
        >
          ×
        </button>

        <div className={styles.iconContainer}>
          <span className={styles.icon}>🏠</span>
        </div>

        <h3 className={styles.title}>Создать новую комнату</h3>

        {/* @ts-expect-error: handleSubmit type mismatch with dynamic schema */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="roomName" className={styles.label}>
              Название комнаты:
            </label>
            <input
              id="roomName"
              type="text"
              {...register('roomName')}
              className={styles.input}
              placeholder="Введите название комнаты"
              maxLength={30}
              autoFocus
            />
            {errors.roomName && (
              <p className={styles.error}>{errors.roomName.message}</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Пароль (необязательно):
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={styles.input}
              placeholder="Введите пароль для комнаты"
            />
            {errors.password && (
              <p className={styles.error}>{errors.password.message}</p>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              Создать комнату
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

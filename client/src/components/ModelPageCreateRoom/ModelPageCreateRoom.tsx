// ModelPageCreateRoom.tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from '../../store/hooks';
import { createRoom } from '../../store/mainPage/mainPageThunks';
import { useNavigate } from 'react-router-dom';

interface FormInputs {
  roomName: string;
  password: string;
}

interface ModelPageCreateRoomProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const schema = yup.object({
  roomName: yup
    .string()
    .required('Название комнаты обязательно')
    .min(5, 'Минимум 5 символов'),
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInputs>({
    // @ts-expect-error: temporarily ignore resolver typing mismatch
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
    // @ts-expect-error: temporarily ignore resolver typing mismatch
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Название комнаты</label>
        <input {...register('roomName')} />
        {errors.roomName && (
          <p style={{ color: 'red' }}>{errors.roomName.message}</p>
        )}
      </div>

      <div>
        <label>Введите пароль</label>
        <input type="password" {...register('password')} />
        {errors.password && (
          <p style={{ color: 'red' }}>{errors.password.message}</p>
        )}
      </div>

      <button type="submit">Создать комнату</button>
    </form>
  );
}

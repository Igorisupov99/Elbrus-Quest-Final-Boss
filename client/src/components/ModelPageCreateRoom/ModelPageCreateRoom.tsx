// ModelPageCreateRoom.tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from '../../store/hooks';
import { createRoom } from '../../store/mainPage/mainPageThunks';

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

export default function ModelPageCreateRoom({ setIsModalOpen }: ModelPageCreateRoomProps) {
  const dispatch = useAppDispatch();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInputs>({
    // @ts-expect-error: temporarily ignore resolver typing mismatch
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: FormInputs) => {
    dispatch(createRoom({ roomName: data.roomName, password: data.password }));

    setIsModalOpen(false);
    reset();
  };

  return (
    // @ts-expect-error: temporarily ignore resolver typing mismatch
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Название комнаты</label>
        <input {...register('roomName')} />
        {errors.roomName && <p style={{ color: 'red' }}>{errors.roomName.message}</p>}
      </div>

      <div>
        <label>Введите пароль</label>
        <input type="password" {...register('password')} />
        {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
      </div>

      <button type="submit">Создать комнату</button>
    </form>
  );
}

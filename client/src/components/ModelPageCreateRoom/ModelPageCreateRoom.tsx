import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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
    .required()
    .matches(
      /^(?=.*[A-Za-z]{5,})(?=.*\d)[A-Za-z\d]+$/,
      'Пароль должен содержать минимум 5 букв (только латиница) и 1 цифру'
    ),
});

export default function ModelPageCreateRoom({
  setIsModalOpen,
}: ModelPageCreateRoomProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: FormInputs) => {
    console.log('✅ Form data:', data);
    setIsModalOpen(false);
  };

  return (
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

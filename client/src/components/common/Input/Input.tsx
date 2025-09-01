import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';
import styles from './Input.module.css';

interface InputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: 'text' | 'email' | 'password' | 'date';
  placeholder?: string;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
}

export const Input = <T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  required = false,
}: InputProps<T>) => {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.error : ''}`}
        {...register(name)}
      />
      
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
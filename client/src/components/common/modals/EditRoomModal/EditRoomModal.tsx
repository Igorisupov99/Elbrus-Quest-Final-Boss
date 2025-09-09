import React, { useState, useEffect } from 'react';
import styles from './EditRoomModal.module.css';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
  currentRoomId: number;
  existingRooms: { id: number; title: string }[];
}

export default function EditRoomModal({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  currentRoomId,
  existingRooms,
}: EditRoomModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError('');
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError('Название комнаты не может быть пустым');
      return;
    }

    if (trimmedName.length < 5) {
      setError('Название должно содержать минимум 5 символов');
      return;
    }

    if (trimmedName === currentName) {
      setError('Название не изменилось');
      return;
    }

    // Check for duplicate names (case-insensitive, excluding current room)
    const isDuplicate = existingRooms.some(
      (room) =>
        room.id !== currentRoomId && // Exclude current room
        room.title.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError('Комната с таким названием уже существует');
      return;
    }

    onConfirm(trimmedName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <div className={styles.iconContainer}>
          <span className={styles.icon}>✏️</span>
        </div>

        <h3 className={styles.title}>Изменить название комнаты</h3>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="roomName" className={styles.label}>
              Новое название:
            </label>
            <input
              id="roomName"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');

                // Real-time validation
                const trimmedValue = e.target.value.trim();
                if (trimmedValue && trimmedValue !== currentName) {
                  const isDuplicate = existingRooms.some(
                    (room) =>
                      room.id !== currentRoomId &&
                      room.title.toLowerCase() === trimmedValue.toLowerCase()
                  );
                  if (isDuplicate) {
                    setError('Комната с таким названием уже существует');
                  }
                }
              }}
              className={styles.input}
              placeholder="Введите новое название комнаты"
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Отмена
            </button>
            <button type="submit" className={styles.confirmButton}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

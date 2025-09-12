import React from 'react';
import { SimpleAvatarShop } from '../../components/AvatarShop/SimpleAvatarShop';
import styles from './AvatarShopPage.module.css';

export const AvatarShopPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Магазин аватаров</h1>
          <p className={styles.subtitle}>
            Выберите уникальный аватар для своего профиля
          </p>
        </div>
        
        <SimpleAvatarShop />
      </div>
    </div>
  );
};

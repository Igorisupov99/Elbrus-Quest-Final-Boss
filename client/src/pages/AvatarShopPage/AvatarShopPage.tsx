import React from 'react';
import { AvatarShop } from '../../components/AvatarShop/AvatarShop';
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
        
        <AvatarShop />
      </div>
    </div>
  );
};

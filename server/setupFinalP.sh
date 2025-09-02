#!/bin/bash

# Установка зависимостей
npm init -y
npm install sequelize sequelize-cli pg pg-hstore dotenv

# Создание .env файла
cat > .env <<EOF
DATABASE_URL=postgres://postgres:123@localhost:5432/elbrus_quest_db
EOF

# Создание правильной структуры папок
mkdir -p db/config db/models db/migrations db/seeders

# Создание .sequelizerc
cat > .sequelizerc <<EOF
const path = require('path');

module.exports = {
  config: path.resolve('db', 'config', 'database.js'),
  'models-path': path.resolve('db', 'models'),
  'seeders-path': path.resolve('db', 'seeders'),
  'migrations-path': path.resolve('db', 'migrations')
}
EOF

# Создание правильного database.js
cat > db/config/database.js <<EOF
require('dotenv').config();

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    }
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
EOF

# Создание БД
npx sequelize db:create

# Создание миграций с правильными полями
npx sequelize migration:create --name create-phases
npx sequelize migration:create --name create-topics
npx sequelize migration:create --name create-questions
npx sequelize migration:create --name create-users
npx sequelize migration:create --name create-game-sessions
npx sequelize migration:create --name create-user-sessions
npx sequelize migration:create --name create-chat-game-sessions
npx sequelize migration:create --name create-chat-messages

# Заполнение миграций правильными полями
# 1. Миграция для phases
PHASES_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-phases.js$' | sort -r | head -n 1)
cat > "db/migrations/${PHASES_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Phases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Phases');
  }
};
EOF

# 2. Миграция для topics
TOPICS_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-topics.js$' | sort -r | head -n 1)
cat > "db/migrations/${TOPICS_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Topics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      phase_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Phases',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Topics');
  }
};
EOF

# 3. Миграция для questions
QUESTIONS_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-questions.js$' | sort -r | head -n 1)
cat > "db/migrations/${QUESTIONS_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      topic_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Topics',
          key: 'id'
        }
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      correct_answer: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      mentor_tip: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Questions');
  }
};
EOF

# 4. Миграция для users
USERS_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-users.js$' | sort -r | head -n 1)
cat > "db/migrations/${USERS_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      username: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
        unique: true
      },
      password_hash: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      role: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: 'user'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
EOF

# 5. Миграция для game-sessions
GAME_SESSIONS_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-game-sessions.js$' | sort -r | head -n 1)
cat > "db/migrations/${GAME_SESSIONS_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GameSessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      phase_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Phases',
          key: 'id'
        }
      },
      current_topic_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'Topics',
          key: 'id'
        }
      },
      current_question_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'Questions',
          key: 'id'
        }
      },
      room_code: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      room_name: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GameSessions');
  }
};
EOF

# 6. Миграция для user-sessions
USER_SESSIONS_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-user-sessions.js$' | sort -r | head -n 1)
cat > "db/migrations/${USER_SESSIONS_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserSessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      game_session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'GameSessions',
          key: 'id'
        }
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      score: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      is_current_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_user_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      player_name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserSessions');
  }
};
EOF

# 7. Миграция для chat-game-sessions
CHAT_GAME_SESSIONS_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-chat-game-sessions.js$' | sort -r | head -n 1)
cat > "db/migrations/${CHAT_GAME_SESSIONS_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ChatGameSessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      game_session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'GameSessions',
          key: 'id'
        }
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ChatGameSessions');
  }
};
EOF

# 8. Миграция для chat-messages
CHAT_MESSAGES_MIGRATION=$(ls db/migrations | grep -E '^[0-9]+-create-chat-messages.js$' | sort -r | head -n 1)
cat > "db/migrations/${CHAT_MESSAGES_MIGRATION}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ChatMessages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ChatMessages');
  }
};
EOF

# Применение миграций
npx sequelize db:migrate

# Создание сидеров
npx sequelize seed:generate --name demo-phase
npx sequelize seed:generate --name demo-topic
npx sequelize seed:generate --name demo-question
npx sequelize seed:generate --name demo-user
npx sequelize seed:generate --name demo-game-session
npx sequelize seed:generate --name demo-user-session

# Заполнение сидов данными
# Phase seeder
PHASE_SEED=$(ls db/seeders | grep -E '^[0-9]+-demo-phase.js$' | sort -r | head -n 1)
cat > "db/seeders/${PHASE_SEED}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Phases', [{
      title: 'Фаза 0: Основы программирования',
      description: 'Введение в основы программирования и алгоритмы',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Фаза 1: Frontend разработка',
      description: 'Изучение HTML, CSS и JavaScript',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Фаза 2: Backend разработка',
      description: 'Изучение Node.js, Express и баз данных',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Phases', null, {});
  }
};
EOF

# Topic seeder
TOPIC_SEED=$(ls db/seeders | grep -E '^[0-9]+-demo-topic.js$' | sort -r | head -n 1)
cat > "db/seeders/${TOPIC_SEED}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Topics', [{
      phase_id: 1,
      title: 'Переменные и типы данных',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      phase_id: 1,
      title: 'Циклы и условия',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      phase_id: 2,
      title: 'HTML и CSS',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Topics', null, {});
  }
};
EOF

# Question seeder
QUESTION_SEED=$(ls db/seeders | grep -E '^[0-9]+-demo-question.js$' | sort -r | head -n 1)
cat > "db/seeders/${QUESTION_SEED}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Questions', [{
      topic_id: 1,
      question_text: 'Что такое переменная в программировании?',
      correct_answer: 'Именованная область памяти для хранения данных',
      mentor_tip: 'Переменная это контейнер для хранения информации',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      topic_id: 2,
      question_text: 'Какой цикл используется для перебора элементов массива?',
      correct_answer: 'Цикл for',
      mentor_tip: 'for (let i = 0; i < array.length; i++) {}',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Questions', null, {});
  }
};
EOF

# User seeder
USER_SEED=$(ls db/seeders | grep -E '^[0-9]+-demo-user.js$' | sort -r | head -n 1)
cat > "db/seeders/${USER_SEED}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      email: 'admin@elbrusbootcamp.com',
      password_hash: 'hashed_password_123',
      image_url: 'https://example.com/avatar1.jpg',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'student1',
      email: 'student1@example.com',
      password_hash: 'hashed_password_456',
      image_url: 'https://example.com/avatar2.jpg',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
EOF

# GameSession seeder
GAME_SESSION_SEED=$(ls db/seeders | grep -E '^[0-9]+-demo-game-session.js$' | sort -r | head -n 1)
cat > "db/seeders/${GAME_SESSION_SEED}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('GameSessions', [{
      phase_id: 1,
      room_code: 'ABCD1234',
      room_name: 'Команда Эльбрус',
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GameSessions', null, {});
  }
};
EOF

# UserSession seeder
USER_SESSION_SEED=$(ls db/seeders | grep -E '^[0-9]+-demo-user-session.js$' | sort -r | head -n 1)
cat > "db/seeders/${USER_SESSION_SEED}" <<EOF
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('UserSessions', [{
      game_session_id: 1,
      user_id: 1,
      player_name: 'Администратор',
      score: 10,
      is_current_active: true,
      is_user_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      game_session_id: 1,
      user_id: 2,
      player_name: 'Студент_1',
      score: 8,
      is_current_active: false,
      is_user_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserSessions', null, {});
  }
};
EOF

# Применение сидов
npx sequelize db:seed:all

echo "✅ Настройка успешно завершена! База данных Elbrus Quest готова к использованию."
echo "📊 База данных: elbrus_quest_db"
echo "📦 Таблицы созданы: Phases, Topics, Questions, Users, GameSessions, UserSessions, ChatGameSessions, ChatMessages"
echo "🌱 Тестовые данные добавлены"
echo "🚀 Миграции применены успешно!"
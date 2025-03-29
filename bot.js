const { Telegraf } = require('telegraf');

// Замените токен на ваш
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Главное меню
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Добавить продукт', callback_data: 'add_product' }],
      [{ text: 'Остаток на сегодня', callback_data: 'calories_left' }],
      [{ text: 'Мои приёмы пищи', callback_data: 'meals' }],
      [{ text: 'Дополнительно', callback_data: 'extra_menu' }],
      [{
        text: 'Открыть Web App',
        web_app: { url: 'https://velvety-marigold-d0d59a.netlify.app' }
      }]
    ]
  }
};

// Дополнительное меню
const extraMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Перерасчёт нормы в день', callback_data: 'recalculate' }],
      [{ text: 'Рекомендуемое меню', callback_data: 'recommended_menu' }],
      [{ text: 'Справочник продуктов', callback_data: 'product_guide' }],
      [{ text: 'Советы по питанию', callback_data: 'nutrition_tips' }],
      [{ text: 'Настройки', callback_data: 'settings' }],
      [{ text: 'Вернуться на главную', callback_data: 'main_menu' }]
    ]
  }
};

// Приветственное сообщение
bot.start((ctx) => {
  ctx.reply('Привет! Я твой умный помощник по питанию. Я помогу тебе рассчитать дневную норму калорий и поделюсь полезными рекомендациями по питанию. 🍏\n\nТы можешь:\n- Использовать команды в этом чате.\n- Или открыть удобное приложение по кнопке ниже.\n\nДля начала нажми на кнопку "Рассчитать калорийность", чтобы начать.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Рассчитать калорийность', callback_data: 'calculate_calories' }],
        [{
          text: 'Открыть Web App',
          web_app: { url: 'https://velvety-marigold-d0d59a.netlify.app' }
        }]
      ]
    }
  });
});

// Функция для получения данных пользователя
async function getUserData(ctx) {
  // Запрос возраста
  const age = await askQuestion(ctx, 'Введи свой возраст (в годах):');
  
  // Запрос веса
  const weight = await askQuestion(ctx, 'Введи свой вес (в кг):');
  
  // Запрос роста
  const height = await askQuestion(ctx, 'Введи свой рост (в см):');
  
  // Запрос пола
  const gender = await askGender(ctx);
  
  // Запрос уровня активности
  const activity = await askActivityLevel(ctx);

  return { age, weight, height, gender, activity };
}

// Функция для отправки вопроса и получения ответа
function askQuestion(ctx, question) {
  return new Promise((resolve) => {
    ctx.reply(question);
    bot.on('text', (messageCtx) => {
      if (messageCtx.chat.id === ctx.chat.id) {
        resolve(messageCtx.message.text); // Ответ пользователя
      }
    });
  });
}

// Функция для выбора пола
function askGender(ctx) {
  return new Promise((resolve) => {
    ctx.reply('Выбери свой пол:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Мужской', callback_data: 'male' }],
          [{ text: 'Женский', callback_data: 'female' }]
        ]
      }
    });

    bot.action(['male', 'female'], (messageCtx) => {
      resolve(messageCtx.match[0]); // Выбранный пол
    });
  });
}

// Функция для выбора уровня активности
function askActivityLevel(ctx) {
  return new Promise((resolve) => {
    ctx.reply('Выбери уровень активности:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Низкий', callback_data: 'activity_1' }],
          [{ text: 'Средний', callback_data: 'activity_2' }],
          [{ text: 'Высокий', callback_data: 'activity_3' }]
        ]
      }
    });

    bot.action(['activity_1', 'activity_2', 'activity_3'], (messageCtx) => {
      resolve(messageCtx.match[0]); // Выбранный уровень активности
    });
  });
}

// Начало расчета калорийности
bot.action('calculate_calories', async (ctx) => {
  try {
    // Получаем все данные пользователя
    const { age, weight, height, gender, activity } = await getUserData(ctx);

    // Рассчитываем калории по упрощенной формуле
    let bmr = gender === 'male'
      ? 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
      : 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);

    const activityFactors = {
      activity_1: 1.2,
      activity_2: 1.375,
      activity_3: 1.55
    };

    const dailyCalories = Math.round(bmr * activityFactors[activity]);

    ctx.reply(`Твоя дневная норма калорий: ${dailyCalories} ккал.`, mainMenu);
  } catch (error) {
    ctx.reply('Произошла ошибка, попробуй снова.');
    console.error(error);
  }
});

// Обработка кнопки "Дополнительно"
bot.action('extra_menu', (ctx) => {
  ctx.reply('Дополнительное меню:', extraMenu);
});

// Обработка кнопки "Перерасчёт нормы"
bot.action('recalculate', (ctx) => {
  ctx.reply('Для перерасчёта введи свой новый возраст, вес, рост, пол и уровень активности.');
  ctx.session = { step: 'age' };  // Начинаем заново
});

// Обработка кнопки "Вернуться на главную"
bot.action('main_menu', (ctx) => {
  ctx.reply('Главное меню:', mainMenu);
});

// Запуск бота
bot.launch();
console.log('Бот запущен! 🚀');

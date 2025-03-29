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

// Начало расчета калорийности
bot.action('calculate_calories', (ctx) => {
  ctx.reply('Введи свой возраст (в годах):');
  ctx.session = { step: 'age' };  // Начинаем с запроса возраста
});

// Обработка текста
bot.on('text', (ctx) => {
  if (ctx.session.step === 'age') {
    ctx.session.age = ctx.message.text;  // Сохраняем введенный возраст
    ctx.session.step = 'weight'; // Переходим к следующему шагу
    ctx.reply('Введи свой вес (в кг):');
  }

  if (ctx.session.step === 'weight') {
    ctx.session.weight = ctx.message.text;  // Сохраняем введенный вес
    ctx.session.step = 'height'; // Переходим к следующему шагу
    ctx.reply('Введи свой рост (в см):');
  }

  if (ctx.session.step === 'height') {
    ctx.session.height = ctx.message.text;  // Сохраняем введенный рост
    ctx.session.step = 'gender'; // Переходим к следующему шагу
    ctx.reply('Выбери свой пол:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Мужской', callback_data: 'male' }],
          [{ text: 'Женский', callback_data: 'female' }]
        ]
      }
    });
  }
});

// Выбор пола
bot.action(['male', 'female'], (ctx) => {
  ctx.session.gender = ctx.match[0];  // Сохраняем выбранный пол
  ctx.session.step = 'activity'; // Переходим к следующему шагу
  ctx.reply('Выбери уровень активности:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Низкий', callback_data: 'activity_1' }],
        [{ text: 'Средний', callback_data: 'activity_2' }],
        [{ text: 'Высокий', callback_data: 'activity_3' }]
      ]
    }
  });
});

// Выбор уровня активности
bot.action(['activity_1', 'activity_2', 'activity_3'], (ctx) => {
  ctx.session.activity = ctx.match[0];  // Сохраняем выбранный уровень активности

  // Рассчитываем калории по упрощенной формуле
  let bmr = ctx.session.gender === 'male'
    ? 88.36 + (13.4 * ctx.session.weight) + (4.8 * ctx.session.height) - (5.7 * ctx.session.age)
    : 447.6 + (9.2 * ctx.session.weight) + (3.1 * ctx.session.height) - (4.3 * ctx.session.age);

  const activityFactors = {
    activity_1: 1.2,
    activity_2: 1.375,
    activity_3: 1.55
  };

  ctx.session.dailyCalories = Math.round(bmr * activityFactors[ctx.session.activity]);

  ctx.reply(`Твоя дневная норма калорий: ${ctx.session.dailyCalories} ккал.`, mainMenu);
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

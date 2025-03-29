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
  ctx.session = {};  // Очистка сессии
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
  ctx.session = {};  // Очистка сессии перед началом нового запроса
  ctx.reply('Введи свой возраст (в годах):');
  ctx.session.step = 'age';  // Начинаем с запроса возраста
});

// Обработка текста
bot.on('text', (ctx) => {
  console.log('Received message:', ctx.message.text);  // Логирование для отладки

  if (ctx.session?.step === 'age') {
    // Сохраняем возраст и идем дальше
    ctx.session.age = parseInt(ctx.message.text);
    ctx.session.step = 'weight';
    console.log('Age set:', ctx.session.age);  // Логируем установленный возраст
    ctx.reply('Введи свой вес (в кг):');
  } else if (ctx.session?.step === 'weight') {
    // Сохраняем вес и идем дальше
    ctx.session.weight = parseFloat(ctx.message.text);
    ctx.session.step = 'height';
    console.log('Weight set:', ctx.session.weight);  // Логируем установленный вес
    ctx.reply('Введи свой рост (в см):');
  } else if (ctx.session?.step === 'height') {
    // Сохраняем рост и идем дальше
    ctx.session.height = parseFloat(ctx.message.text);
    ctx.session.step = 'gender';
    console.log('Height set:', ctx.session.height);  // Логируем установленный рост
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
  console.log('Gender selected:', ctx.match[0]);  // Логируем выбранный пол
  ctx.session.gender = ctx.match[0];
  ctx.session.step = 'activity';
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
  console.log('Activity level selected:', ctx.match[0]);  // Логируем выбранный уровень активности
  ctx.session.activity = ctx.match[0];
  
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

// Запуск бота
bot.launch();
console.log('Бот запущен! 🚀');

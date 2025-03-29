const { Telegraf, session } = require('telegraf');

// Замените токен на ваш
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Инициализация сессии
bot.use(session());

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

// Приветственное сообщение
bot.start((ctx) => {
  ctx.reply('Привет! Я твой умный помощник по питанию. Я помогу тебе рассчитать дневную норму калорий и поделюсь полезными рекомендациями. 🍏\n\nТы можешь:\n- Использовать команды в этом чате.\n- Или открыть удобное приложение по кнопке ниже.\n\nДля начала нажми на кнопку "Рассчитать калорийность", чтобы начать.', {
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

// Обработчик для расчета калорий
bot.action('calculate_calories', (ctx) => {
  ctx.session = { step: 'age' };
  return ctx.reply('Введи свой возраст (в годах):');
});

// Обработчик ввода возраста
bot.on('text', (ctx) => {
  if (ctx.session?.step === 'age') {
    const age = parseInt(ctx.message.text);
    if (!isNaN(age) && age > 0) {
      ctx.session.age = age;
      ctx.session.step = 'weight';
      return ctx.reply('Введи свой вес (в кг):');
    }
    return ctx.reply('Пожалуйста, введи корректный возраст.');
  }
});

// Обработчик ввода веса
bot.on('text', (ctx) => {
  if (ctx.session?.step === 'weight') {
    const weight = parseFloat(ctx.message.text);
    if (!isNaN(weight) && weight > 0) {
      ctx.session.weight = weight;
      ctx.session.step = 'height';
      return ctx.reply('Введи свой рост (в см):');
    }
    return ctx.reply('Пожалуйста, введи корректный вес.');
  }
});

// Обработчик ввода роста
bot.on('text', (ctx) => {
  if (ctx.session?.step === 'height') {
    const height = parseFloat(ctx.message.text);
    if (!isNaN(height) && height > 0) {
      ctx.session.height = height;
      ctx.session.step = 'gender';
      return ctx.reply('Выбери свой пол:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Мужской', callback_data: 'male' }],
            [{ text: 'Женский', callback_data: 'female' }]
          ]
        }
      });
    }
    return ctx.reply('Пожалуйста, введи корректный рост.');
  }
});

// Обработчик выбора пола
bot.action(['male', 'female'], (ctx) => {
  if (ctx.session?.step === 'gender') {
    ctx.session.gender = ctx.callbackQuery.data;
    ctx.session.step = 'activity';
    return ctx.reply('Выбери уровень активности:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Низкий', callback_data: 'activity_1' }],
          [{ text: 'Средний', callback_data: 'activity_2' }],
          [{ text: 'Высокий', callback_data: 'activity_3' }]
        ]
      }
    });
  }
});

// Обработчик выбора активности
bot.action(['activity_1', 'activity_2', 'activity_3'], (ctx) => {
  if (ctx.session?.step === 'activity') {
    const activity = ctx.callbackQuery.data;
    ctx.session.activity = activity;

    // Рассчитываем калории
    let bmr = ctx.session.gender === 'male'
      ? 88.36 + (13.4 * ctx.session.weight) + (4.8 * ctx.session.height) - (5.7 * ctx.session.age)
      : 447.6 + (9.2 * ctx.session.weight) + (3.1 * ctx.session.height) - (4.3 * ctx.session.age);

    const activityFactors = {
      activity_1: 1.2,
      activity_2: 1.375,
      activity_3: 1.55
    };

    ctx.session.dailyCalories = Math.round(bmr * activityFactors[ctx.session.activity]);

    // Отправляем результат
    return ctx.reply(`Твоя дневная норма калорий: ${ctx.session.dailyCalories} ккал.`, mainMenu);
  }
});

// Запуск бота
bot.launch();
console.log('Бот запущен! 🚀');
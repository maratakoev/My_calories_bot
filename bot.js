const { Telegraf, session } = require('telegraf');

const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Инициализация сессии
bot.use(session({
  defaultSession: () => ({ step: null })
}));

// Главное менюф
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
  ctx.reply(
    'Привет! Я твой умный помощник по питанию. 🍏\n\n' +
    'Я помогу рассчитать дневную норму калорий.\n\n' +
    'Нажми кнопку ниже, чтобы начать.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Рассчитать калорийность', callback_data: 'calculate_calories' }],
          [{
            text: 'Открыть Web App',
            web_app: { url: 'https://velvety-marigold-d0d59a.netlify.app' }
          }]
        ]
      }
    }
  );
});

// Запуск диалога расчёта калорий
bot.action('calculate_calories', (ctx) => {
  ctx.session = { step: 'age' }; // Начинаем с запроса возраста
  return ctx.reply('Введи свой возраст (например, 25):');
});

// Обработка возраста
bot.hears(/^\d+$/, (ctx) => {
  if (ctx.session?.step !== 'age') return;

  const age = parseInt(ctx.message.text);
  if (age < 10 || age > 120) {
    return ctx.reply('❌ Введи реальный возраст (от 10 до 120 лет).');
  }

  ctx.session.age = age;
  ctx.session.step = 'weight'; // Переходим к весу
  return ctx.reply('Теперь введи свой вес в кг (например, 70):');
});

// Обработка веса
bot.hears(/^\d+$/, (ctx) => {
  if (ctx.session?.step !== 'weight') return;

  const weight = parseFloat(ctx.message.text);
  if (weight < 30 || weight > 300) {
    return ctx.reply('❌ Введи реальный вес (от 30 до 300 кг).');
  }

  ctx.session.weight = weight;
  ctx.session.step = 'height'; // Переходим к росту
  return ctx.reply('Теперь введи рост в см (например, 175):');
});

// Обработка роста
bot.hears(/^\d+$/, (ctx) => {
  if (ctx.session?.step !== 'height') return;

  const height = parseFloat(ctx.message.text);
  if (height < 100 || height > 250) {
    return ctx.reply('❌ Введи реальный рост (от 100 до 250 см).');
  }

  ctx.session.height = height;
  ctx.session.step = 'gender'; // Переходим к полу
  return ctx.reply('Выбери пол:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Мужской ♂️', callback_data: 'male' }],
        [{ text: 'Женский ♀️', callback_data: 'female' }]
      ]
    }
  });
});

// Обработка выбора пола
bot.action(['male', 'female'], (ctx) => {
  if (ctx.session?.step !== 'gender') return;

  ctx.session.gender = ctx.callbackQuery.data;
  ctx.session.step = 'activity'; // Переходим к активности
  return ctx.reply('Выбери уровень активности:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛌 Низкий (офисная работа)', callback_data: 'activity_1' }],
        [{ text: '🚶‍♂️ Средний (тренировки 1-3 раза/неделю)', callback_data: 'activity_2' }],
        [{ text: '🏋️‍♂️ Высокий (тренировки 5+ раз/неделю)', callback_data: 'activity_3' }]
      ]
    }
  });
});

// Обработка выбора активности и расчёт калорий
bot.action(['activity_1', 'activity_2', 'activity_3'], (ctx) => {
  if (ctx.session?.step !== 'activity') return;

  const activity = ctx.callbackQuery.data;
  const { age, weight, height, gender } = ctx.session;

  // Формула Миффлина-Сан Жеора (более точная, чем Харриса-Бенедикта)
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Коэффициенты активности
  const activityFactors = {
    activity_1: 1.2,    // Минимальная активность
    activity_2: 1.375,  // Небольшая активность
    activity_3: 1.55    // Умеренная активность
  };

  const dailyCalories = Math.round(bmr * activityFactors[activity]);
  ctx.session.dailyCalories = dailyCalories;
  ctx.session.step = null; // Завершаем диалог

  // Форматируем результат
  const resultText = 
    `✅ Расчёт завершён!\n\n` +
    `▪ Возраст: ${age} лет\n` +
    `▪ Вес: ${weight} кг\n` +
    `▪ Рост: ${height} см\n` +
    `▪ Пол: ${gender === 'male' ? 'мужской ♂️' : 'женский ♀️'}\n` +
    `\n🔥 Ваша дневная норма: <b>${dailyCalories} ккал</b>`;

  return ctx.replyWithHTML(resultText, mainMenu);
});

// Обработка любых других сообщений
bot.on('message', (ctx) => {
  if (ctx.session?.step) {
    return ctx.reply('Пожалуйста, ответь на текущий вопрос.');
  }
  return ctx.reply('Используй кнопки меню для навигации.', mainMenu);
});

// Запуск бота
bot.launch()
  .then(() => console.log('Бот запущен 🚀'))
  .catch((err) => console.error('Ошибка запуска:', err));
const { Telegraf } = require('telegraf');

// Замените токен на ваш
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Приветственное сообщение
bot.start((ctx) => {
  ctx.reply('Привет! Давай начнем задавать вопросы. Введи свой возраст (в годах):');
  ctx.session = { step: 'age' }; // Начинаем с вопроса о возрасте
});

// Обработка ввода данных
bot.on('text', (ctx) => {
  if (ctx.session.step === 'age') {
    ctx.session.age = ctx.message.text; // Сохраняем возраст
    ctx.session.step = 'weight'; // Переходим к следующему вопросу
    ctx.reply('Введи свой вес (в кг):');
  } else if (ctx.session.step === 'weight') {
    ctx.session.weight = ctx.message.text; // Сохраняем вес
    ctx.session.step = 'height'; // Переходим к следующему вопросу
    ctx.reply('Введи свой рост (в см):');
  } else if (ctx.session.step === 'height') {
    ctx.session.height = ctx.message.text; // Сохраняем рост
    ctx.session.step = 'gender'; // Переходим к следующему вопросу
    ctx.reply('Выбери свой пол:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Мужской', callback_data: 'male' }],
          [{ text: 'Женский', callback_data: 'female' }]
        ]
      }
    });
  } else if (ctx.session.step === 'gender') {
    // Дожидаемся нажатия кнопки пола
  }
});

// Обработка выбора пола
bot.action(['male', 'female'], (ctx) => {
  ctx.session.gender = ctx.match[0]; // Сохраняем пол
  ctx.session.step = 'activity'; // Переходим к следующему вопросу
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

// Обработка выбора уровня активности
bot.action(['activity_1', 'activity_2', 'activity_3'], (ctx) => {
  ctx.session.activity = ctx.match[0]; // Сохраняем уровень активности
  ctx.reply('Спасибо за информацию! Мы можем рассчитать вашу дневную норму калорий.');

  // Рассчитываем калории (примерная формула)
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
  ctx.reply(`Твоя дневная норма калорий: ${ctx.session.dailyCalories} ккал.`);
});

// Запуск бота
bot.launch();
console.log('Бот запущен! 🚀');

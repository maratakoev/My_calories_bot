const { Telegraf } = require('telegraf');

// Ваш токен, замените на свой
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Данные пользователя (например, можно хранить в объекте)
const userData = {};
const userState = {}; // Для отслеживания состояния каждого пользователя

// Команда /start
bot.start((ctx) => {
  const userId = ctx.from.id;

  if (!userData[userId]) {
    // Запрос на данные при первом входе
    ctx.reply(
      'Привет! Я помогу тебе отслеживать калории. Для начала введи данные для расчета дневной калорийности.',
      {
        reply_markup: {
          keyboard: [
            ['Расчет калорийности'],
          ],
          resize_keyboard: true, // Подстраивает клавиатуру
        },
      }
    );
    userState[userId] = 'waiting_for_weight'; // Начинаем с ввода веса
  } else {
    // Показываем основное меню, если данные уже введены
    showMainMenu(ctx);
  }
});

// Запрос данных для расчета калорийности
bot.hears('Расчет калорийности', (ctx) => {
  const userId = ctx.from.id;

  // Если бот ждет ввода веса
  if (userState[userId] === 'waiting_for_weight') {
    ctx.reply('Введите свой вес (кг):');
    userState[userId] = 'waiting_for_height'; // Переходим к следующему шагу
  }
});

// Обработчик ввода текста (для ввода данных)
bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  if (userState[userId] === 'waiting_for_weight') {
    // Сохраняем вес
    userData[userId] = { weight: userMessage };
    ctx.reply('Теперь введи свой рост (см):');
    userState[userId] = 'waiting_for_height'; // Переходим к следующему шагу
  } else if (userState[userId] === 'waiting_for_height') {
    // Сохраняем рост
    userData[userId].height = userMessage;
    ctx.reply('Теперь введи свой возраст (лет):');
    userState[userId] = 'waiting_for_age'; // Переходим к следующему шагу
  } else if (userState[userId] === 'waiting_for_age') {
    // Сохраняем возраст
    userData[userId].age = userMessage;
    ctx.reply('Теперь введи свой пол (мужчина/женщина):');
    userState[userId] = 'waiting_for_gender'; // Переходим к следующему шагу
  } else if (userState[userId] === 'waiting_for_gender') {
    // Сохраняем пол
    userData[userId].gender = userMessage;
    ctx.reply('Укажи свою активность (низкая/средняя/высокая):');
    userState[userId] = 'waiting_for_activity'; // Переходим к следующему шагу
  } else if (userState[userId] === 'waiting_for_activity') {
    // Сохраняем активность
    userData[userId].activity = userMessage;
    ctx.reply('Твои данные для расчета дневной калорийности сохранены! Теперь ты можешь использовать меню.', {
      reply_markup: {
        keyboard: [
          ['Добавить продукт', 'Остаток на сегодня'],
          ['Мои приемы пищи', 'Дополнительно'],
        ],
        resize_keyboard: true,
      },
    });
    userState[userId] = null; // Сброс состояния, переход к обычному меню
  }
});

// Функция для показа основного меню
function showMainMenu(ctx) {
  ctx.reply(
    'Теперь ты можешь начать отслеживать калории!',
    {
      reply_markup: {
        keyboard: [
          ['Добавить продукт', 'Остаток на сегодня'],
          ['Мои приемы пищи', 'Дополнительно'],
        ],
        resize_keyboard: true,
      },
    }
  );
}

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен!');
});

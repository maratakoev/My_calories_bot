const { Telegraf, session } = require('telegraf');

// Вставьте свой токен
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Подключаем session middleware
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

// Функции для каждого шага
function askAge(ctx) {
  ctx.reply('Введи свой возраст (в годах):');
  ctx.session.step = 'age';
}

function askWeight(ctx) {
  ctx.reply('Введи свой вес (в кг):');
  ctx.session.step = 'weight';
}

function askHeight(ctx) {
  ctx.reply('Введи свой рост (в см):');
  ctx.session.step = 'height';
}

function askGender(ctx) {
  ctx.reply('Выбери свой пол:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Мужской', callback_data: 'male' }],
        [{ text: 'Женский', callback_data: 'female' }]
      ]
    }
  });
  ctx.session.step = 'gender';
}

function askActivity(ctx) {
  ctx.reply('Выбери уровень активности:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Низкий', callback_data: 'activity_1' }],
        [{ text: 'Средний', callback_data: 'activity_2' }],
        [{ text: 'Высокий', callback_data: 'activity_3' }]
      ]
    }
  });
  ctx.session.step = 'activity';
}

// Приветственное сообщение
bot.start((ctx) => {
  ctx.reply(
    'Привет! Я твой умный помощник по питанию. Я помогу тебе рассчитать дневную норму калорий и поделюсь полезными рекомендациями по питанию. 🍏\n\nТы можешь:\n- Использовать команды в этом чате.\n- Или открыть удобное приложение по кнопке ниже.\n\nДля начала нажми на кнопку "Рассчитать калорийность", чтобы начать.',
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

// Начало расчета калорийности
bot.action('calculate_calories', (ctx) => {
  ctx.session.step = 'age'; // Убедитесь, что сессия инициализирована
  askAge(ctx);
});

// Обработка текстовых сообщений для ввода данных
bot.on('text', (ctx) => {
  console.log('Получено сообщение:', ctx.message.text);

  if (ctx.session?.step === 'age') {
    const age = parseInt(ctx.message.text);
    if (isNaN(age) || age <= 0) {
      return ctx.reply('Пожалуйста, введи корректный возраст.');
    }
    ctx.session.age = age;
    console.log('Возраст установлен:', ctx.session.age);
    return askWeight(ctx);
  } 
  else if (ctx.session?.step === 'weight') {
    const weight = parseFloat(ctx.message.text);
    if (isNaN(weight) || weight <= 0) {
      return ctx.reply('Пожалуйста, введи корректный вес.');
    }
    ctx.session.weight = weight;
    console.log('Вес установлен:', ctx.session.weight);
    return askHeight(ctx);
  } 
  else if (ctx.session?.step === 'height') {
    const height = parseFloat(ctx.message.text);
    if (isNaN(height) || height <= 0) {
      return ctx.reply('Пожалуйста, введи корректный рост.');
    }
    ctx.session.height = height;
    console.log('Рост установлен:', ctx.session.height);
    return askGender(ctx);
  }
});

// Выбор пола
bot.action(['male', 'female'], (ctx) => {
  console.log('Выбран пол:', ctx.match[0]);
  ctx.session.gender = ctx.match[0];
  return askActivity(ctx);
});

// Выбор уровня активности и расчет калорий
bot.action(['activity_1', 'activity_2', 'activity_3'], (ctx) => {
  console.log('Выбран уровень активности:', ctx.match[0]);
  ctx.session.activity = ctx.match[0];

  // Упрощенная формула расчета BMR
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
  askAge(ctx);
});

// Обработка кнопки "Вернуться на главную"
bot.action('main_menu', (ctx) => {
  ctx.reply('Главное меню:', mainMenu);
});

// Запуск бота
bot.launch();
console.log('Бот запущен! 🚀');

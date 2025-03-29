import { Telegraf } from 'telegraf';

const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Хранилище для информации о пользователе
const userData = {};

// Формула для расчета калорий
function calculateCalories(weight, height, age, gender, activityLevel) {
  let bmr;

  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };

  return bmr * activityMultipliers[activityLevel];
}

// Обработка команды /start
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  userData[userId] = {};

  await ctx.reply('Привет! Я могу помогать с расчетами и хранением информации о калориях.', {
    reply_markup: {
      keyboard: [
        [
          { text: 'Перейти в мини-апп', callback_data: 'miniApp' },
          { text: 'Начать сбор информации', callback_data: 'startInfoCollection' }
        ]
      ],
      one_time_keyboard: true,
    }
  });
});

// Начало сбора информации
bot.action('startInfoCollection', async (ctx) => {
  const userId = ctx.from.id;
  
  // Прячем кнопку сбора информации
  await ctx.editMessageReplyMarkup({
    keyboard: [
      [
        { text: 'Перейти в мини-апп', callback_data: 'miniApp' }
      ],
    ],
    one_time_keyboard: true,
  });

  // Спросим о росте
  await ctx.reply('Введите ваш рост (в см):');
  userData[userId].step = 'height';
});

// Сбор данных о пользователе
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  if (userData[userId] && userData[userId].step === 'height') {
    userData[userId].height = parseInt(ctx.message.text);
    userData[userId].step = 'weight';
    await ctx.reply('Введите ваш вес (в кг):');
  } else if (userData[userId] && userData[userId].step === 'weight') {
    userData[userId].weight = parseInt(ctx.message.text);
    userData[userId].step = 'age';
    await ctx.reply('Введите ваш возраст:');
  } else if (userData[userId] && userData[userId].step === 'age') {
    userData[userId].age = parseInt(ctx.message.text);
    userData[userId].step = 'gender';
    await ctx.reply('Введите ваш пол (male/female):');
  } else if (userData[userId] && userData[userId].step === 'gender') {
    userData[userId].gender = ctx.message.text.toLowerCase();
    userData[userId].step = 'activity';
    await ctx.reply('Введите уровень активности (sedentary, light, moderate, active, veryActive):');
  } else if (userData[userId] && userData[userId].step === 'activity') {
    userData[userId].activity = ctx.message.text.toLowerCase();
    const { weight, height, age, gender, activity } = userData[userId];
    
    // Рассчитываем калории
    const calories = calculateCalories(weight, height, age, gender, activity);
    
    // Отправляем информацию о калориях
    await ctx.reply(`Ваши дневные калории: ${Math.round(calories)} ккал`);

    // Отображаем основные кнопки
    await ctx.reply('Что вы хотите делать?', {
      reply_markup: {
        keyboard: [
          [
            { text: 'Показать статистику' },
            { text: 'Мои заметки' }
          ],
          [
            { text: 'Дополнительно' }
          ]
        ],
        one_time_keyboard: true
      }
    });

    // Дополнительные кнопки
    bot.hears('Дополнительно', async (ctx) => {
      await ctx.reply('Дополнительные функции:', {
        reply_markup: {
          keyboard: [
            [
              { text: 'История калорий' },
              { text: 'Настройки' }
            ],
            [
              { text: 'Вернуться в меню' }
            ]
          ],
          one_time_keyboard: true
        }
      });
    });
  }
});

// Обработка перехода в мини-апп
bot.action('miniApp', async (ctx) => {
  await ctx.reply('Переход в мини-апп...');
});

// Запуск бота
bot.launch();

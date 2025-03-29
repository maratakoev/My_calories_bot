const { Telegraf } = require('telegraf');

// Ваш токен, замените на свой
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Данные пользователя (пример, реальную базу данных можно использовать вместо объекта)
const userData = {};

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
  } else {
    // Показываем основное меню, если данные уже введены
    showMainMenu(ctx);
  }
});

// Основное меню
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

// Кнопка "Дополнительно"
bot.hears('Дополнительно', (ctx) => {
  ctx.reply(
    'Выбери одно из дополнительных действий:',
    {
      reply_markup: {
        keyboard: [
          ['Справочник продуктов', 'Советы по питанию'],
          ['Настройки', 'Перерасчет дневной калорийности'],
          ['Вернуться на главную'],
        ],
        resize_keyboard: true,
      },
    }
  );
});

// Кнопка "Перерасчет дневной калорийности"
bot.hears('Перерасчет дневной калорийности', (ctx) => {
  const userId = ctx.from.id;
  
  ctx.reply('Давай обновим твои данные для перерасчета дневной калорийности. Введи свой новый вес (кг):');
  
  // Запрос на новый вес
  bot.on('text', (ctx) => {
    const newWeight = ctx.message.text;
    userData[userId].weight = newWeight;  // Обновляем вес

    ctx.reply('Введи свой новый рост (см):');
    bot.on('text', (ctx) => {
      const newHeight = ctx.message.text;
      userData[userId].height = newHeight;  // Обновляем рост

      // После ввода всех данных, показываем основное меню с обновленными данными
      ctx.reply('Твои данные обновлены! Теперь ты можешь продолжить использовать меню.', {
        reply_markup: {
          keyboard: [
            ['Добавить продукт', 'Остаток на сегодня'],
            ['Мои приемы пищи', 'Дополнительно'],
          ],
          resize_keyboard: true,
        },
      });
    });
  });
});

// Обработчик для кнопки "Расчет калорийности"
bot.hears('Расчет калорийности', (ctx) => {
  const userId = ctx.from.id;
  
  ctx.reply('Для расчета калорийности введи свой рост (см):');
  
  bot.on('text', (ctx) => {
    const height = ctx.message.text;
    userData[userId] = { height };

    ctx.reply('Теперь введи свой вес (кг):');
    bot.on('text', (ctx) => {
      const weight = ctx.message.text;
      userData[userId].weight = weight;

      ctx.reply('Введи свой возраст (лет):');
      bot.on('text', (ctx) => {
        const age = ctx.message.text;
        userData[userId].age = age;

        ctx.reply('Теперь введи свой пол (мужчина/женщина):');
        bot.on('text', (ctx) => {
          const gender = ctx.message.text;
          userData[userId].gender = gender;

          ctx.reply('Укажи свою активность (низкая/средняя/высокая):');
          bot.on('text', (ctx) => {
            const activity = ctx.message.text;
            userData[userId].activity = activity;

            // Здесь можно добавить расчет калорий по введенным данным
            ctx.reply('Твои данные для расчета дневной калорийности сохранены! Теперь ты можешь использовать меню.', {
              reply_markup: {
                keyboard: [
                  ['Добавить продукт', 'Остаток на сегодня'],
                  ['Мои приемы пищи', 'Дополнительно'],
                ],
                resize_keyboard: true,
              },
            });
          });
        });
      });
    });
  });
});

// Команда для открытия Web App
bot.start((ctx) => {
  ctx.reply(
    'Привет! Нажми на кнопку ниже, чтобы открыть наш Web App!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть Web App',
              web_app: { url: 'https://velvety-marigold-d0d59a.netlify.app' } // Замените на ваш URL
            }
          ]
        ]
      }
    }
  );
});

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен!');
});

bot.start((ctx) => {
  const userId = ctx.from.id;

  if (!userData[userId]) {
    ctx.reply(
      'Привет! Я помогу тебе отслеживать калории. Для начала введи данные для расчета дневной калорийности.',
      {
        reply_markup: {
          keyboard: [
            ['Расчет калорийности'],
          ],
          resize_keyboard: true,
        },
      }
    );
  } else {
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

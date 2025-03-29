const { Telegraf } = require('telegraf');

// Вставляем API ключ
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Создаём словарь с синонимами
const productSynonyms = {
  яблоко: ['яблоки', 'яблочко', 'яблока'],
  курица: ['курицы', 'куриное мясо', 'курин'],
  банан: ['бананы'],
  // добавь другие продукты по мере необходимости
};

// Функция для нормализации ввода
function getNormalizedProduct(input) {
  input = input.toLowerCase(); // Приводим к нижнему регистру
  for (const product in productSynonyms) {
    if (productSynonyms[product].includes(input)) {
      return product; // Возвращаем нормализованное название продукта
    }
  }
  return null; // Если не нашли совпадений
}

// Обработчик команды /start
bot.start((ctx) => {
  ctx.reply(
    'Привет! Я помогу тебе отслеживать калории. Выбери действие:',
    {
      reply_markup: {
        keyboard: [
          ['Добавить продукт'],  // Кнопка для добавления продукта
          ['Мой лимит калорий'],  // Кнопка для просмотра лимита
          ['Остаток калорий'],  // Кнопка для остатка калорий
          ['Справочник продуктов'],  // Кнопка для справочника продуктов
          ['Открыть Web App'], // Кнопка для открытия веб-апп
        ],
        resize_keyboard: true,  // Автоматическая подгонка клавиатуры
        one_time_keyboard: true,  // Клавиатура исчезает после нажатия
      },
    }
  );
});

// Обработчик для добавления продукта
bot.hears('Добавить продукт', (ctx) => {
  ctx.reply('Напиши, что ты съел, например: "200 г курицы".');
});

// Обработчик для лимита калорий
bot.hears('Мой лимит калорий', (ctx) => {
  // Тут можно добавить логику для отображения дневного лимита
  ctx.reply('Твой дневной лимит калорий: 2000 ккал');
});

// Обработчик для остатка калорий
bot.hears('Остаток калорий', (ctx) => {
  // Тут можно добавить логику для подсчёта остатка калорий
  ctx.reply('У тебя осталось 500 ккал на сегодня.');
});

// Обработчик для справочника продуктов
bot.hears('Справочник продуктов', (ctx) => {
  ctx.reply('Напиши продукт, и я скажу, сколько в нём калорий.');
});

// Обработчик для открытия Web App
bot.hears('Открыть Web App', (ctx) => {
  ctx.reply(
    'Для более точных расчётов открой наш Web App!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть Web App',
              web_app: { url: 'https://velvety-marigold-d0d59a.netlify.app' } // Ссылка на сайт
            }
          ]
        ]
      }
    }
  );
});

// Обработчик текста (обрабатывает запросы на добавление продуктов)
bot.on('text', (ctx) => {
  const userInput = ctx.message.text.trim().toLowerCase();
  const normalizedProduct = getNormalizedProduct(userInput);  // Функция, которую мы обсуждали ранее

  if (normalizedProduct) {
    ctx.reply(`Ты упомянул ${normalizedProduct}.`);
    // Тут можно добавить логику для добавления калорий или других действий
  } else {
    ctx.reply('Прости, я не понял продукт. Попробуй написать другое название.');
  }
});

bot.launch();
console.log('Бот запущен!');

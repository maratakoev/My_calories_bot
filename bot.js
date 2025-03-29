
require('dotenv').config();
const { Telegraf } = require('telegraf');

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
      [{ text: 'Справочник продуктов', callback_data: 'product_guide' }],
      [{ text: 'Советы по питанию', callback_data: 'nutrition_tips' }],
      [{ text: 'Перерасчёт калорий', callback_data: 'recalculate' }],
      [{ text: 'Вернуться на главную', callback_data: 'main_menu' }]
    ]
  }
};

bot.start((ctx) => {
  ctx.reply('Привет! Давай рассчитаем твою дневную норму калорий.', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Рассчитать калорийность', callback_data: 'calculate_calories' }]]
    }
  });
});

bot.action('calculate_calories', (ctx) => {
  ctx.reply('Введи свой вес (кг):');
  ctx.session = { step: 'weight' };
});

bot.on('text', (ctx) => {
  if (ctx.session?.step === 'weight') {
    ctx.session.weight = parseFloat(ctx.message.text);
    ctx.session.step = 'height';
    ctx.reply('Введи свой рост (см):');
  } else if (ctx.session?.step === 'height') {
    ctx.session.height = parseFloat(ctx.message.text);
    ctx.session.step = 'age';
    ctx.reply('Введи свой возраст:');
  } else if (ctx.session?.step === 'age') {
    ctx.session.age = parseInt(ctx.message.text);
    ctx.session.step = 'gender';
    ctx.reply('Выбери свой пол:', {
      reply_markup: {
        inline_keyboard: [[
          { text: 'Мужской', callback_data: 'male' },
          { text: 'Женский', callback_data: 'female' }
        ]]
      }
    });
  }
});

bot.action(['male', 'female'], (ctx) => {
  ctx.session.gender = ctx.match[0];
  ctx.session.step = 'activity';
  ctx.reply('Выбери уровень активности:', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Минимальная', callback_data: 'activity_1' },
        { text: 'Лёгкая', callback_data: 'activity_2' },
        { text: 'Средняя', callback_data: 'activity_3' },
        { text: 'Высокая', callback_data: 'activity_4' }
      ]]
    }
  });
});

bot.action(['activity_1', 'activity_2', 'activity_3', 'activity_4'], (ctx) => {
  ctx.session.activity = ctx.match[0];
  // Рассчёт калорийности (упрощённая формула)
  let bmr = ctx.session.gender === 'male' 
    ? 88.36 + (13.4 * ctx.session.weight) + (4.8 * ctx.session.height) - (5.7 * ctx.session.age)
    : 447.6 + (9.2 * ctx.session.weight) + (3.1 * ctx.session.height) - (4.3 * ctx.session.age);

  const activityFactors = { activity_1: 1.2, activity_2: 1.375, activity_3: 1.55, activity_4: 1.725 };
  ctx.session.dailyCalories = Math.round(bmr * activityFactors[ctx.session.activity]);
  
  ctx.reply(`Твоя дневная норма калорий: ${ctx.session.dailyCalories} ккал.`, mainMenu);
});

bot.action('extra_menu', (ctx) => {
  ctx.reply('Дополнительное меню:', extraMenu);
});

bot.action('main_menu', (ctx) => {
  ctx.reply('Главное меню:', mainMenu);
});

bot.launch();
console.log('Бот запущен! 🚀');

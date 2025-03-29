import { Telegraf, session, Markup } from 'telegraf';
import dotenv from 'dotenv';
import process from 'node:process';

// Инициализация
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = 'https://velvety-marigold-d0d59a.netlify.app';

// ================== КОНФИГУРАЦИЯ СЕССИИ ==================
bot.use(session({
  defaultSession: () => ({
    isFirstLaunch: true,
    step: null,
    profile: {
      age: null,
      weight: null,
      height: null,
      gender: null,
      activity: null
    },
    dailyCalories: null,
    consumedToday: 0,
    waterIntake: 0,
    meals: [],
    history: [],
    reminders: []
  })
}));

// ================== ГЕНЕРАЦИЯ МЕНЮ ==================
const getMainMenu = (ctx) => {
  const buttons = [];
  
  if (!ctx.session.profile.age) {
    buttons.push([Markup.button.callback('🍽 Рассчитать норму калорий', 'calculate_calories')]);
  } else {
    buttons.push(
      [Markup.button.callback(`📊 Остаток: ${ctx.session.dailyCalories - ctx.session.consumedToday} ккал`, 'calories_left')],
      [Markup.button.callback('➕ Добавить продукт', 'add_product')],
      [Markup.button.callback('💧 Вода: ' + ctx.session.waterIntake + ' мл', 'water_tracker')]
    );
  }

  buttons.push(
    [Markup.button.webApp('📲 Продолжить в приложении', WEB_APP_URL)],
    [Markup.button.callback('⚙️ Дополнительно', 'extra_menu')]
  );

  return Markup.inlineKeyboard(buttons);
};

const extraMenu = Markup.inlineKeyboard([
  [Markup.button.callback('⏰ Напоминания', 'set_reminders')],
  [Markup.button.callback('📈 Графики прогресса', 'show_charts')],
  [Markup.button.callback('🍱 Шаблоны рационов', 'meal_templates')],
  [Markup.button.callback('📦 Мои продукты', 'my_products')],
  [Markup.button.callback('◀️ Назад', 'back_to_main')]
]);

// ================== ОСНОВНЫЕ ОБРАБОТЧИКИ ==================
bot.start((ctx) => {
  const message = ctx.session.isFirstLaunch 
    ? 'Привет! Я помогу с расчетом калорий. 🍏\nНачнем с определения вашей нормы?'
    : 'С возвращением! Чем займемся сегодня?';
  
  ctx.session.isFirstLaunch = false;
  return ctx.reply(message, getMainMenu(ctx));
});

// ================== РАСЧЕТ КАЛОРИЙ ==================
const calculateCalories = (age, weight, height, gender, activity) => {
  const bmr = gender === 'male' 
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  
  const factors = { low: 1.2, medium: 1.375, high: 1.55 };
  return Math.round(bmr * factors[activity]);
};

bot.action('calculate_calories', (ctx) => {
  ctx.session.step = 'age';
  return ctx.reply('Введите ваш возраст:', Markup.removeKeyboard());
});

bot.on('text', async (ctx) => {
  if (ctx.session.step === 'age') {
    const age = parseInt(ctx.message.text);
    if (age < 10 || age > 120) return ctx.reply('Введите реальный возраст (10-120):');
    ctx.session.profile.age = age;
    ctx.session.step = 'weight';
    await ctx.reply('Введите ваш вес (кг):');
  }
  else if (ctx.session.step === 'weight') {
    const weight = parseFloat(ctx.message.text);
    if (weight < 30 || weight > 300) return ctx.reply('Введите реальный вес (30-300 кг):');
    ctx.session.profile.weight = weight;
    ctx.session.step = 'height';
    await ctx.reply('Введите ваш рост (см):');
  }
  else if (ctx.session.step === 'height') {
    const height = parseFloat(ctx.message.text);
    if (height < 100 || height > 250) return ctx.reply('Введите реальный рост (100-250 см):');
    ctx.session.profile.height = height;
    ctx.session.step = 'gender';
    await ctx.reply('Выберите пол:', Markup.inlineKeyboard([
      [Markup.button.callback('Мужской ♂️', 'gender_male')],
      [Markup.button.callback('Женский ♀️', 'gender_female')]
    ]));
  }
});

bot.action(['gender_male', 'gender_female'], async (ctx) => {
  ctx.session.profile.gender = ctx.callbackQuery.data.replace('gender_', '');
  ctx.session.step = 'activity';
  await ctx.editMessageText('Выберите активность:', Markup.inlineKeyboard([
    [Markup.button.callback('Низкая 🛌', 'activity_low')],
    [Markup.button.callback('Средняя 🚶‍♂️', 'activity_medium')],
    [Markup.button.callback('Высокая 🏋️‍♂️', 'activity_high')]
  ]));
});

bot.action(['activity_low', 'activity_medium', 'activity_high'], async (ctx) => {
  const activity = ctx.callbackQuery.data.replace('activity_', '');
  const { age, weight, height, gender } = ctx.session.profile;
  
  ctx.session.dailyCalories = calculateCalories(age, weight, height, gender, activity);
  ctx.session.history.push({
    date: new Date().toLocaleDateString(),
    calories: ctx.session.dailyCalories
  });
  
  await ctx.deleteMessage();
  await ctx.replyWithHTML(
    `✅ <b>Ваша норма:</b> ${ctx.session.dailyCalories} ккал/день\n\n` +
    `▪ Возраст: ${age}\n▪ Вес: ${weight} кг\n▪ Рост: ${height} см\n` +
    `▪ Пол: ${gender === 'male' ? '♂️' : '♀️'}\n▪ Активность: ${activity.replace('_', ' ')}`,
    getMainMenu(ctx)
  );
});

// ================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ==================
bot.action('water_tracker', (ctx) => {
  ctx.session.step = 'water_input';
  return ctx.reply('Сколько воды вы выпили (мл)?');
});

bot.on('text', async (ctx) => {
  if (ctx.session.step === 'water_input') {
    const ml = parseInt(ctx.message.text);
    if (isNaN(ml)) return ctx.reply('Введите число!');
    ctx.session.waterIntake += ml;
    await ctx.reply(`✅ Добавлено ${ml} мл. Всего: ${ctx.session.waterIntake} мл`);
    return ctx.reply('Главное меню:', getMainMenu(ctx));
  }
});

bot.action('extra_menu', (ctx) => {
  return ctx.editMessageText('⚙️ Дополнительные функции:', extraMenu);
});

bot.action('back_to_main', (ctx) => {
  return ctx.editMessageText('Главное меню:', getMainMenu(ctx));
});

// ================== ИНТЕГРАЦИЯ С WEBAPP ==================
bot.on('web_app_data', (ctx) => {
  const data = ctx.webAppData.data.json();
  if (data.type === 'add_product') {
    ctx.session.consumedToday += data.calories;
    ctx.reply(`✅ Добавлено ${data.calories} ккал (${data.name})`, getMainMenu(ctx));
  }
});

// ================== ЗАПУСК ==================
bot.launch().then(() => console.log('Бот запущен 🚀'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
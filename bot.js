import pkg from "telegraf";
const { Telegraf, Markup } = pkg;
import dotenv from "dotenv";
import schedule from "node-schedule";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const userData = {};

// Константы
const ACTIVITY_LEVELS = {
  "🪑 Низкая": 1.2,
  "🚶 Средняя": 1.55,
  "🏃 Высокая": 1.725,
};

const WEB_APP_BUTTON = Markup.button.webApp(
  "📲 Открыть приложение", 
  "https://ваш-сайт.app"
);

// Клавиатуры
const mainMenu = Markup.keyboard([
  ["🍴 Рассчитать калории"],
  [WEB_APP_BUTTON]
]).resize();

const calculationMenu = Markup.keyboard([
  ["➕ Добавить калории", "📊 Остаток"],
  [WEB_APP_BUTTON]
]).resize();

const afterInputMenu = Markup.keyboard([
  ["➕ Добавить ещё", "📊 Остаток"],
  [WEB_APP_BUTTON]
]).resize();

// Функции
function createProgressBar(consumed, total) {
  const percentage = Math.min(100, Math.round((consumed / total) * 100));
  const filled = '▓'.repeat(Math.round(percentage / 5));
  const empty = '░'.repeat(20 - filled.length);
  return `${filled}${empty} ${percentage}%`;
}

function getCaloriesStatus(remaining) {
  if (remaining < 0) return `🔴 Превышено на ${Math.abs(remaining)} ккал`;
  if (remaining < 200) return '🟡 Почти достигли нормы';
  return '🟢 В пределах нормы';
}

function scheduleDailyReset() {
  schedule.scheduleJob('0 0 * * *', () => {
    Object.keys(userData).forEach(userId => {
      if (userData[userId]?.dailyCalories) {
        userData[userId].consumedCalories = 0;
        userData[userId].remainingCalories = userData[userId].dailyCalories;
        bot.telegram.sendMessage(
          userId,
          `🔄 Новый день! Дневная норма: ${userData[userId].dailyCalories} ккал`,
          calculationMenu
        ).catch(console.error);
      }
    });
  });
}

// Обработчики
bot.start(ctx => ctx.replyWithMarkdown(
  `🥗 *Контроль питания*\n\nЯ помогу считать калории и следить за рационом!`,
  mainMenu
));

bot.hears("🍴 Рассчитать калории", ctx => {
  userData[ctx.from.id] = {};
  ctx.reply("Укажите ваш пол:", Markup.inlineKeyboard([
    [Markup.button.callback("♂️ Мужской", "gender_male")],
    [Markup.button.callback("♀️ Женский", "gender_female")]
  ]));
});

bot.action(/gender_(male|female)/, ctx => {
  userData[ctx.from.id].gender = ctx.match[1];
  ctx.deleteMessage();
  ctx.reply("📅 Введите ваш возраст:", Markup.removeKeyboard());
});

bot.on("text", ctx => {
  const userId = ctx.from.id;
  const user = userData[userId];
  if (!user?.gender) return;

  if (!user.age) {
    const age = parseInt(ctx.message.text);
    if (isNaN(age)) return ctx.reply("Введите число:");
    user.age = age;
    return ctx.reply("⚖️ Введите ваш вес (кг):");
  }

  if (!user.weight) {
    const weight = parseFloat(ctx.message.text);
    if (isNaN(weight)) return ctx.reply("Введите число:");
    user.weight = weight;
    return ctx.reply("📏 Введите ваш рост (см):");
  }

  if (!user.height) {
    const height = parseInt(ctx.message.text);
    if (isNaN(height)) return ctx.reply("Введите число:");
    user.height = height;
    ctx.reply("Выберите активность:", Markup.inlineKeyboard([
      [Markup.button.callback("🪑 Низкая", "activity_low")],
      [Markup.button.callback("🚶 Средняя", "activity_medium")],
      [Markup.button.callback("🏃 Высокая", "activity_high")]
    ]));
  }
});

bot.action(/activity_(low|medium|high)/, ctx => {
  const userId = ctx.from.id;
  const user = userData[userId];
  const activity = ctx.match[1];
  
  const bmr = user.gender === "male"
    ? 88.362 + 13.397 * user.weight + 4.799 * user.height - 5.677 * user.age
    : 447.593 + 9.247 * user.weight + 3.098 * user.height - 4.33 * user.age;
  
  const activityText = {
    low: "🪑 Низкая",
    medium: "🚶 Средняя",
    high: "🏃 Высокая"
  }[activity];
  
  user.dailyCalories = Math.round(bmr * ACTIVITY_LEVELS[activityText]);
  user.consumedCalories = 0;
  user.remainingCalories = user.dailyCalories;
  
  ctx.deleteMessage();
  ctx.replyWithMarkdown(
    `*Ваша норма: ${user.dailyCalories} ккал/день*\n` +
    `Активность: ${activityText}`,
    calculationMenu
  );
});

bot.hears(/^(\d+)\s*(ккал)?$/i, ctx => {
  const userId = ctx.from.id;
  const user = userData[userId];
  if (!user?.dailyCalories) return ctx.reply("Сначала рассчитайте норму", mainMenu);

  const calories = parseInt(ctx.match[1]);
  user.consumedCalories = (user.consumedCalories || 0) + calories;
  user.remainingCalories = user.dailyCalories - user.consumedCalories;

  ctx.replyWithMarkdown(
    `✅ +${calories} ккал\n` +
    `${createProgressBar(user.consumedCalories, user.dailyCalories)}\n` +
    `🍽 Съедено: ${user.consumedCalories}\n` +
    `⚖️ Осталось: ${user.remainingCalories}\n` +
    `📊 ${getCaloriesStatus(user.remainingCalories)}`,
    afterInputMenu
  );
});

bot.hears("📊 Остаток", ctx => {
  const userId = ctx.from.id;
  const user = userData[userId];
  if (!user?.dailyCalories) return ctx.reply("Сначала рассчитайте норму", mainMenu);

  ctx.replyWithMarkdown(
    `📊 *Баланс калорий*\n\n` +
    `${createProgressBar(user.consumedCalories || 0, user.dailyCalories)}\n` +
    `🔸 Норма: ${user.dailyCalories} ккал\n` +
    `🍽 Съедено: ${user.consumedCalories || 0}\n` +
    `⚖️ Осталось: ${user.remainingCalories}\n` +
    `📈 ${getCaloriesStatus(user.remainingCalories)}`,
    calculationMenu
  );
});

bot.hears("➕ Добавить ещё", ctx => ctx.reply("Введите количество калорий:"));

// Запуск
bot.launch().then(() => {
  console.log("Бот запущен");
  scheduleDailyReset();
}).catch(console.error);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
import pkg from "telegraf";
const { Telegraf, Markup } = pkg;
import dotenv from "dotenv";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const userData = {};

// Уровни активности и коэффициенты
const ACTIVITY_LEVELS = {
  "🪑 Низкая": 1.2,
  "🚶 Средняя": 1.55,
  "🏃 Высокая": 1.725,
};

// Приветственное сообщение
const welcomeMessage = `🥗 *Помощник контроля правильного питания* 🍎

Я помогу вам:
✅ Рассчитать индивидуальную норму калорий
📝 Записывать приемы пищи
⏰ Напоминать о времени еды
📊 Анализировать ваш рацион

Вы можете:
1. Продолжить здесь - приступим к расчету калорий
2. Перейти в наше приложение, если вам удобнее работать там

Формула расчета: Харриса-Бенедикта (наиболее точная)`;

// Главное меню (всегда с кнопкой приложения)
const mainMenu = Markup.keyboard([
  ["🍴 Рассчитать калории"],
  [
    Markup.button.webApp(
      "📲 Открыть приложение",
      "https://velvety-marigold-d0d59a.netlify.app"
    ),
  ],
]).resize();

// Меню после расчета калорий (всегда с кнопкой приложения)
const afterCalculationMenu = Markup.keyboard([
  ["➕ Добавить прием пищи"],
  ["📊 Остаток калорий"],
  [
    Markup.button.webApp(
      "📲 Открыть приложение",
      "https://velvety-marigold-d0d59a.netlify.app"
    ),
  ],
]).resize();

// Обработчик старта
bot.start(async (ctx) => {
  await ctx.replyWithMarkdown(welcomeMessage, mainMenu);
});

// Начало расчета
bot.hears("🍴 Рассчитать калории", (ctx) => {
  userData[ctx.from.id] = {};
  ctx.reply(
    "Для точного расчета укажите ваш пол:",
    Markup.inlineKeyboard([
      [Markup.button.callback("♂️ Мужской", "gender_male")],
      [Markup.button.callback("♀️ Женский", "gender_female")],
    ])
  );
});

// Обработка выбора пола
bot.action(/gender_(male|female)/, (ctx) => {
  const userId = ctx.from.id;
  userData[userId].gender = ctx.match[1];
  ctx.deleteMessage();
  ctx.reply("📅 Введите ваш возраст (полных лет):");
});

// Обработка ввода данных
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  if (!userData[userId]?.gender) return;

  if (!userData[userId].age) {
    const age = parseInt(ctx.message.text);
    if (isNaN(age) || age < 10 || age > 120) {
      return ctx.reply("Пожалуйста, введите корректный возраст (10-120):");
    }
    userData[userId].age = age;
    return ctx.reply("⚖️ Введите ваш текущий вес в кг:");
  }

  if (!userData[userId].weight) {
    const weight = parseFloat(ctx.message.text);
    if (isNaN(weight) || weight < 30 || weight > 300) {
      return ctx.reply("Пожалуйста, введите корректный вес (30-300 кг):");
    }
    userData[userId].weight = weight;
    return ctx.reply("📏 Введите ваш рост в см:");
  }

  if (!userData[userId].height) {
    const height = parseInt(ctx.message.text);
    if (isNaN(height) || height < 100 || height > 250) {
      return ctx.reply("Пожалуйста, введите корректный рост (100-250 см):");
    }
    userData[userId].height = height;

    // Предлагаем выбрать уровень активности
    return ctx.reply(
      "Выберите ваш уровень физической активности:",
      Markup.inlineKeyboard([
        [Markup.button.callback("🪑 Низкая (офисная работа)", "activity_low")],
        [
          Markup.button.callback(
            "🚶 Средняя (3-4 тренировки в неделю)",
            "activity_medium"
          ),
        ],
        [
          Markup.button.callback(
            "🏃 Высокая (ежедневные тренировки)",
            "activity_high"
          ),
        ],
      ])
    );
  }
});

// Обработка уровня активности и расчет
bot.action(/activity_(low|medium|high)/, (ctx) => {
  const userId = ctx.from.id;
  const activityKey = ctx.match[1];
  const user = userData[userId];

  const activityTexts = {
    low: "🪑 Низкая",
    medium: "🚶 Средняя",
    high: "🏃 Высокая",
  };

  const activityText = activityTexts[activityKey];
  const activityCoefficient = ACTIVITY_LEVELS[activityText];

  // Расчет по формуле Харриса-Бенедикта
  let bmr;
  if (user.gender === "male") {
    bmr =
      88.362 + 13.397 * user.weight + 4.799 * user.height - 5.677 * user.age;
  } else {
    bmr = 447.593 + 9.247 * user.weight + 3.098 * user.height - 4.33 * user.age;
  }

  const dailyCalories = Math.round(bmr * activityCoefficient);

  // Сохраняем результаты
  user.dailyCalories = dailyCalories;
  user.remainingCalories = dailyCalories;
  user.activity = activityText;

  // Формируем подробный отчет
  const report = `🍏 *Ваши параметры питания*
  
▸ Пол: ${user.gender === "male" ? "♂️ Мужской" : "♀️ Женский"}
▸ Возраст: ${user.age} лет
▸ Вес: ${user.weight} кг
▸ Рост: ${user.height} см
▸ Активность: ${activityText}

⚡ *Рекомендуемая дневная норма: ${dailyCalories} ккал*

Теперь я могу:
• Запоминать ваши приемы пищи 🍽
• Напоминать о времени еды ⏰
• Следить за балансом питательных веществ`;

  ctx.deleteMessage();
  ctx.replyWithMarkdown(report, afterCalculationMenu);
});

// Обработчик кнопки приложения (на всякий случай)
bot.hears("📲 Открыть приложение", (ctx) => {
  ctx.reply("Открываю приложение...");
});

// Обработчик добавления приема пищи (пример с кнопкой приложения)
bot.hears("➕ Добавить прием пищи", (ctx) => {
  ctx.reply(
    "Выберите тип приема пищи:",
    Markup.keyboard([
      ["🍳 Завтрак", "🍲 Обед"],
      ["🍵 Ужин", "🍎 Перекус"],
      ["📲 Открыть приложение"], // Кнопка остается
    ]).resize()
  );
});

// Обработчик остатка калорий (пример с кнопкой приложения)
bot.hears("📊 Остаток калорий", (ctx) => {
  const userId = ctx.from.id;
  const user = userData[userId];
  if (!user?.dailyCalories) {
    return ctx.reply("Сначала рассчитайте вашу норму калорий.");
  }

  ctx.reply(
    `Ваш остаток на сегодня: ${user.remainingCalories}/${user.dailyCalories} ккал`,
    Markup.keyboard([
      ["➕ Добавить прием пищи"],
      ["📲 Открыть приложение"], // Кнопка остается
    ]).resize()
  );
});

// Запуск бота
bot
  .launch()
  .then(() => console.log("✅ Бот запущен и готов к работе!"))
  .catch((err) => console.error("❌ Ошибка запуска:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

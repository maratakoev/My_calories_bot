import { Telegraf } from 'telegraf';
import { session } from 'telegraf';  // Это встроенный middleware для сессий

// Инициализация бота с вашим токеном
const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Используем сессии для хранения данных пользователей
bot.use(session());  // Подключаем сессионный middleware

// Состояния
const STATES = {
  NAME: 'name',
  AGE: 'age',
};

// Запуск бота и приветственное сообщение
bot.start((ctx) => {
  ctx.session = { state: STATES.NAME };  // Инициализируем состояние пользователя
  return ctx.reply('Привет! Как тебя зовут?');
});

// Обработка ввода имени
bot.on('text', (ctx) => {
  const userState = ctx.session.state;

  if (userState === STATES.NAME) {
    ctx.session.name = ctx.message.text;  // Сохраняем имя
    ctx.session.state = STATES.AGE;      // Переход к следующему состоянию
    return ctx.reply(`Приятно познакомиться, ${ctx.session.name}! Сколько тебе лет?`);
  }

  if (userState === STATES.AGE) {
    ctx.session.age = ctx.message.text;  // Сохраняем возраст
    return ctx.reply(`Спасибо за информацию! Ты сказал, что тебе ${ctx.session.age} лет.`);
  }
});

// Отмена процесса
bot.command('cancel', (ctx) => {
  ctx.session = null;  // Очищаем сессию
  return ctx.reply('Операция отменена.');
});

// Запуск бота
bot.launch();

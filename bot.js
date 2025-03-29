
// Замените токен на ваш
import { Telegraf } from 'telegraf';
import session from 'telegraf/session';

const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Используем сессии для хранения данных пользователей
bot.use(session());

// Состояния
const STATES = {
  NAME: 'name',
  AGE: 'age',
};

// Запуск бота и приветствие
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  ctx.session = { state: STATES.NAME };  // Инициализируем состояние пользователя
  return ctx.reply('Привет! Как тебя зовут?');
});

// Обработка ввода имени
bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  const userState = ctx.session.state;

  if (userState === STATES.NAME) {
    ctx.session.name = ctx.message.text;  // Сохраняем имя
    ctx.session.state = STATES.AGE;      // Переходим к следующему шагу
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

bot.launch();

const { Telegraf } = require('telegraf');

const bot = new Telegraf('7616676414:AAED_kQUdF5PPnSWfdCDGeqnWji0TYznNYY');

// Обработчик команды /start
bot.start((ctx) => {
  ctx.reply(
    'Привет! Нажми на кнопку ниже, чтобы открыть наш Web App!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть Web App',
              web_app: { url: 'https://velvety-marigold-d0d59a.netlify.app' } // Указываем URL вашего сайта
            }
          ]
        ]
      }
    }
  );
});

bot.help((ctx) => ctx.reply('Напиши /start, чтобы начать.'));
bot.on('text', (ctx) => ctx.reply(`Ты написал: ${ctx.message.text}`));

bot.launch();
console.log('Бот запущен!');

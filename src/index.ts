import { Client } from 'discord.js';
import { Bot } from './bot';
import * as cmdArgs from 'command-line-args';

const client = new Client();
const invokePrefix = '?>';

const bot = new Bot();

client.on("message", async (message) => {
  if(message.author.bot) return;

  if(!message.content.startsWith(invokePrefix)) return;
  if(message.content.startsWith(`${invokePrefix}play`)) {
    bot.play(message);
  } else if(message.content.startsWith(`${invokePrefix}join`)) {
    bot.join(message);
  } else if(message.content.startsWith(`${invokePrefix}current`)) {
    bot.current(message);
  } else if(message.content.startsWith(`${invokePrefix}toggle`)) {
    bot.toggle(message);
  } else if(message.content.startsWith(`${invokePrefix}list`)) {
    bot.list(message);
  } else if(message.content.startsWith(`${invokePrefix}exit`)) {
    bot.leave();
    message.channel.send("Exiting from voice chat.");
  }
});

client.on("disconnect", () => bot.leave());

const loginOption = cmdArgs([{
  name: "token",
  type: String,
  defaultOption: true
}]);
console.log(process.env.token);
console.log((loginOption.token || process.env.token));
client.login(loginOption.token || process.env.token);
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const bot_1 = require("./bot");
const cmdArgs = require("command-line-args");
const client = new discord_js_1.Client();
const invokePrefix = '?>';
const bot = new bot_1.Bot();
client.on("message", async (message) => {
    if (message.author.bot)
        return;
    if (!message.content.startsWith(invokePrefix))
        return;
    if (message.content.startsWith(`${invokePrefix}play`)) {
        bot.play(message);
    }
    else if (message.content.startsWith(`${invokePrefix}join`)) {
        bot.join(message);
    }
    else if (message.content.startsWith(`${invokePrefix}current`)) {
        bot.current(message);
    }
    else if (message.content.startsWith(`${invokePrefix}toggle`)) {
        bot.toggle(message);
    }
    else if (message.content.startsWith(`${invokePrefix}list`)) {
        bot.list(message);
    }
    else if (message.content.startsWith(`${invokePrefix}exit`)) {
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
client.login(loginOption.token || process.env.token);
//# sourceMappingURL=index.js.map
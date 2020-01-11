"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("./queue");
const ytdl = require("ytdl-core");
const ytsr = require('ytsr');
class Bot {
    constructor() {
        this.queue = new queue_1.Queue();
    }
    decideText(argument) {
        // shamelessly copied from stackoverflow
        // https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
        const urlRegexp = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i');
        if (!!urlRegexp.test(argument))
            return "url";
        return "search";
    }
    getUriHostname(uri) {
        const link = new URL(uri);
        return link.hostname;
    }
    playStream(message, link, stream) {
        if (!this.queue.onVoiceChat())
            this.queue.join(message.guild);
        this.queue.add(message, link, stream);
    }
    play(message) {
        const argument = message.content.split(' ')[1];
        const argumentType = this.decideText(argument);
        if (argumentType === "url") {
            const host = this.getUriHostname(argument);
            if (host === "youtube.com" || host === "youtu.be") {
                this.playStream(message, argument, ytdl(argument, {
                    quality: "highestaudio",
                    highWaterMark: 1 << 25
                }));
            }
        }
    }
    join(message) {
        const argument = message.content.split(' ')[1];
        this.queue.join(message.guild, argument);
    }
    leave() {
        this.queue.leave();
    }
    async current(message) {
        this.queue.displayCurrent(message);
    }
    toggle(message) {
        this.queue.toggleState(message);
    }
    list(message) {
        this.queue.list(message);
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map
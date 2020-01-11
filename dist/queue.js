"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ytInfo = require('youtube-info');
const html_to_text_1 = require("html-to-text");
class Queue {
    constructor() {
        this.joinedVC = false;
        this.internalQueue = new Array();
        this.playing = undefined;
    }
    onVoiceChat() { return this.joinedVC; }
    async join(guild, channelName = "Music") {
        const musicChannel = guild.channels.find(channel => channel.name === channelName);
        if (musicChannel instanceof discord_js_1.VoiceChannel) {
            if (!musicChannel.joinable)
                throw new Error("could not join channel " + channelName);
            this.vcConnection = await musicChannel.join();
            this.joinedVC = true;
        }
    }
    getCurrentVideoId() {
        var _a, _b, _c, _d, _e;
        if ((_a = this.playing) === null || _a === void 0 ? void 0 : _a.track.link.includes("youtu.be"))
            return _c = (_b = this.playing) === null || _b === void 0 ? void 0 : _b.track.link.split('/').pop(), (_c !== null && _c !== void 0 ? _c : "");
        if ((_d = this.playing) === null || _d === void 0 ? void 0 : _d.track.link.includes("youtube.com"))
            return (_e = this.playing) === null || _e === void 0 ? void 0 : _e.track.link.split('=')[1];
        return "";
    }
    async displayCurrent(message) {
        ytInfo(this.getCurrentVideoId(), (err, info) => {
            var _a;
            if (err) {
                console.error(err);
                return;
            }
            const embed = new discord_js_1.RichEmbed();
            embed.setTitle(info.title);
            embed.setThumbnail(info.thumbnailUrl)
                .setURL(((_a = this.playing) === null || _a === void 0 ? void 0 : _a.track.link) || "")
                .setDescription(html_to_text_1.fromString(info.description).substr(0, 200))
                .setColor(0xEF63A3);
            message.channel.send(embed);
        });
    }
    async attemptToQueueNext() {
        if (this.internalQueue.length !== 1 && this.internalQueue.length !== 0) {
            this.internalQueue.shift();
            if (!this.joinedVC) {
                this.internalQueue[0].triggerMessage.channel.send("Voice chat not joined yet.");
                return;
            }
            if (!this.vcConnection) {
                this.internalQueue[0].triggerMessage.channel.send("Voice connection no initialized.");
                return;
            }
            this.playing = {
                dispatched: this.vcConnection.playStream(this.internalQueue[0].stream),
                track: this.internalQueue[0]
            };
            await this.attachNotifications();
            this.playing.dispatched.on("end", () => this.attemptToQueueNext());
        }
        else if (this.internalQueue.length === 1) {
            this.playing = undefined;
            this.internalQueue = [];
        }
    }
    async add(message, link, stream) {
        if (!this.joinedVC) {
            message.channel.send("Voice chat not joined yet.");
            return;
        }
        if (!this.vcConnection) {
            message.channel.send("Voice connection no initialized.");
            return;
        }
        this.internalQueue.push({
            playing: false,
            stream,
            triggerMessage: message,
            link
        });
        // If this is the first item in the queue, then play it.
        if (this.internalQueue.length === 1) {
            this.playing = {
                dispatched: this.vcConnection.playStream(stream),
                track: this.internalQueue[0]
            };
            this.playing.dispatched.on("end", () => this.attemptToQueueNext());
            await this.attachNotifications();
        }
    }
    toggleState(message) {
        var _a, _b;
        if ((_a = this.playing) === null || _a === void 0 ? void 0 : _a.dispatched.paused) {
            this.playing.dispatched.resume();
        }
        else {
            (_b = this.playing) === null || _b === void 0 ? void 0 : _b.dispatched.pause();
        }
    }
    async attachNotifications() {
        if (!this.playing)
            return;
        this.playing.dispatched.on("start", () => {
            if (!this.playing)
                return;
            console.log(`Started playing track. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`);
            this.playing.track.triggerMessage.channel.send(`Started playing track. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`);
        });
        this.playing.dispatched.on("end", () => {
            if (!this.playing)
                return;
            console.log(`Track finished playing. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`);
            this.playing.track.triggerMessage.channel.send(`Track finished playing. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`);
        });
    }
    async list(message) {
        const infoList = await Promise.all(this.internalQueue.map(track => {
            return new Promise((resolve, reject) => {
                ytInfo((err, info) => {
                    if (err)
                        reject(err);
                    resolve({
                        title: info.title
                    });
                });
            });
        }));
        message.channel.send(`Queue:\n${infoList.map((title, index) => `${index + 1}. **${title}**`).join("\n")}`);
    }
    leave() {
        var _a;
        this.playing = undefined;
        (_a = this.vcConnection) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.vcConnection = undefined;
        this.joinedVC = false;
        this.internalQueue = [];
    }
}
exports.Queue = Queue;
//# sourceMappingURL=queue.js.map
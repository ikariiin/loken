import { Guild, VoiceChannel, VoiceConnection, StreamDispatcher, Message, RichEmbed } from "discord.js";
import { Readable } from "stream";
const ytInfo = require('youtube-info');
import { fromString } from "html-to-text";

export interface Track {
  playing: boolean;
  stream: Readable;
  triggerMessage: Message;
  link: string;
}

export class Queue {
  private joinedVC: boolean = false;
  private vcConnection?: VoiceConnection;
  private internalQueue: Array<Track> = new Array();
  private playing?: {
    track: Track;
    dispatched: StreamDispatcher
  } = undefined;

  constructor() {}

  public onVoiceChat(): boolean { return this.joinedVC; }

  public async join(guild: Guild, channelName: string = "Music"): Promise<void> {
    const musicChannel = guild.channels.find(channel => channel.name === channelName);
    if(musicChannel instanceof VoiceChannel) {
      if(!musicChannel.joinable) throw new Error("could not join channel " + channelName);
      this.vcConnection = await musicChannel.join();
      this.joinedVC = true;
    }
  }

  protected getCurrentVideoId(): string {
    if(this.playing?.track.link.includes("youtu.be")) return this.playing?.track.link.split('/').pop() ?? "";
    if(this.playing?.track.link.includes("youtube.com")) return this.playing?.track.link.split('=')[1];
    return "";
  }

  public async displayCurrent(message: Message): Promise<void> {
    ytInfo(
      this.getCurrentVideoId(),
      (err: Error, info: any) => {
        if(err) { console.error(err); return; }
        const embed = new RichEmbed();
        embed.setTitle(info.title);
        embed.setThumbnail(info.thumbnailUrl)
          .setURL(this.playing?.track.link || "")
          .setDescription(fromString(info.description).substr(0, 200))
          .setColor(0xEF63A3);
        message.channel.send(embed);
      }
    )
  }

  private async attemptToQueueNext(): Promise<void> {
    if(this.internalQueue.length !== 1 && this.internalQueue.length !== 0) {
      this.internalQueue.shift();
      if(!this.joinedVC) { this.internalQueue[0].triggerMessage.channel.send("Voice chat not joined yet."); return; }
      if(!this.vcConnection) { this.internalQueue[0].triggerMessage.channel.send("Voice connection no initialized."); return; }
      this.playing = {
        dispatched: this.vcConnection.playStream(this.internalQueue[0].stream),
        track: this.internalQueue[0]
      };
      await this.attachNotifications();
      this.playing.dispatched.on("end", () => this.attemptToQueueNext());
    } else if(this.internalQueue.length === 1) {
      this.playing = undefined;
      this.internalQueue = [];
    }
  }

  public async add(message: Message, link: string, stream: Readable): Promise<void> {
    if(!this.joinedVC) { message.channel.send("Voice chat not joined yet."); return; }
    if(!this.vcConnection) { message.channel.send("Voice connection no initialized."); return; }

    this.internalQueue.push({
      playing: false,
      stream,
      triggerMessage: message,
      link
    });
    // If this is the first item in the queue, then play it.
    if(this.internalQueue.length === 1) {
      this.playing = {
        dispatched: this.vcConnection.playStream(stream),
        track: this.internalQueue[0]
      };
      this.playing.dispatched.on("end", () => this.attemptToQueueNext());
      await this.attachNotifications();
    }
  }

  public toggleState(message: Message): void {
    if(this.playing?.dispatched.paused) {
      this.playing.dispatched.resume();
    } else {
      this.playing?.dispatched.pause();
    }
  }

  protected async attachNotifications(): Promise<void> {
    if(!this.playing) return;
    this.playing.dispatched.on(
      "start",
      () => {
        if(!this.playing) return;
        console.log(`Started playing track. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`);
        this.playing.track.triggerMessage.channel.send(
          `Started playing track. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`
        );
      }
    );
    this.playing.dispatched.on(
      "end",
      () => {
        if(!this.playing) return;
        console.log(`Track finished playing. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`);
        this.playing.track.triggerMessage.channel.send(
          `Track finished playing. Queued by ${this.playing.track.triggerMessage.author.username}#${this.playing.track.triggerMessage.author.discriminator}`
        );
      }
    );
  }

  public async list(message: Message): Promise<void> {
    const infoList = await Promise.all(this.internalQueue.map(track => {
      return new Promise((resolve, reject) => {
        ytInfo((err: Error, info: any) => {
          if(err) reject(err);

          resolve({
            title: info.title
          });
        });
      });
    }));
    message.channel.send(
      `Queue:\n${infoList.map((title, index) => `${index + 1}. **${title}**`).join("\n")}`
    )
  }

  public leave(): void {
    this.playing = undefined;
    this.vcConnection?.disconnect();
    this.vcConnection = undefined;
    this.joinedVC = false;
    this.internalQueue = [];
  }
}
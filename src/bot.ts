import { Queue } from "./queue";
import { Message, VoiceChannel } from "discord.js";
import * as ytdl from 'ytdl-core';
import { Readable } from "stream";
const ytsr = require('ytsr');

export class Bot {
  private queue = new Queue();

  constructor() {}

  private decideText(argument: string): "url"|"search" {
    // shamelessly copied from stackoverflow
    // https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    const urlRegexp = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i');
    if(!!urlRegexp.test(argument)) return "url";

    return "search";
  }

  protected getUriHostname(uri: string): string {
    const link = new URL(uri);
    return link.hostname
  }

  private playStream(message: Message, link: string, stream: Readable) {
    if(!this.queue.onVoiceChat()) this.queue.join(message.guild);
    this.queue.add(message, link, stream);
  }

  public play(message: Message) {
    const argument = message.content.split(' ')[1];
    const argumentType = this.decideText(argument);

    if(argumentType === "url") {
      const host = this.getUriHostname(argument);
      if(host === "youtube.com" || host === "youtu.be") {
        this.playStream(message, argument, ytdl(argument, { 
          quality: "highestaudio",
          highWaterMark: 1<<25
        }));
      }
    }
  }

  public join(message: Message): void {
    const argument = message.content.split(' ')[1];
    this.queue.join(message.guild, argument);
  }

  public leave(): void {
    this.queue.leave();
  }

  public async current(message: Message): Promise<void> {
    this.queue.displayCurrent(message);
  }

  public toggle(message: Message): void {
    this.queue.toggleState(message);
  }

  public list(message: Message): void {
    this.queue.list(message);
  }
}
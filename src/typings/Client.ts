import {ApplicationCommandDataResolvable, Collection} from "discord.js";
import ConfigJson from "../config/config.json";
import {ImapSimpleOptions} from "imap-simple";

export interface RegisterCommandsOptions {
    guildId?: string;
    clientId?: string;
    commands: ApplicationCommandDataResolvable[];
}

export type ConfigType = {
    ids: (typeof ConfigJson.dev | typeof ConfigJson.live),
    imap: {
        user: string,
        password: string,
        tls: boolean,
        port: number,
        host: string
    }
}
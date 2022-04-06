import {
    ApplicationCommandDataResolvable,
    Client,
    ClientEvents,
    ClientOptions,
    Collection
} from "discord.js";
import glob from "glob";
import { promisify } from "util";
import * as process from "process";
import ConfigJson from '../config/config.json';
import {Event} from "./Event";
import {Embeds, Logger} from "../utils";
import {CommandType, ConfigType} from "../typings";
import Mailer from "./Mailer";

import TurndownService = require('turndown');

const utf8 = require('utf8')

const globPromise = promisify(glob);

export class ExtendedClient extends Client {

    commands: Collection<string, CommandType> = new Collection<string, CommandType>();

    mailer: Mailer;

    config: ConfigType = {
        ids: process.env.APP_ENV === 'dev'? ConfigJson.dev : ConfigJson.live,
        imap: ConfigJson.mail,
    };

    constructor(options: ClientOptions) {
        super(options);
        this.config.imap.password = process.env.MAIL_PASS
    }

    static async importFile(filePath: string) {
        return (await import(filePath))?.default;
    }

    async start() {

        await this.registerCommands();
        await this.registerEvents();

        this.login(process.env.TOKEN).then(async () => {
            this.mailer = new Mailer({
                channelID: this.config.ids.channel_id,
                imap: this.config.imap,
                mailbox: "INBOX",
                mails: ['raillardarsene44@gmail.com', "raillardarsene44t@gmail.com"]
            })
            this.mailer.start();

            this.mailer.on('connected', () => {
                Logger.success('Connected to mail server');
            })
            this.mailer.on('error', Logger.error);
            this.mailer.on('message', (message) => {
                let Turndown = new TurndownService();
                this.mailer.channel.send({
                    embeds: [
                        Embeds.DEFAULT_TEMPLATE()
                            .setColor('BLURPLE')
                            .setAuthor({name: `FROM ${message.headers.get('from').text} | ${message.headers.get('date')}`})
                            .setTitle(`${message.headers.get('subject')}`)
                            .setTimestamp(message.headers.get('x-bm-transport-timestamp'))
                            .setDescription(Turndown.turndown(message.body.html))
                    ]
                });
            });
        });
    }

    async registerEvents() {
        const eventsFiles = await globPromise(
            `${__dirname}/../events/*{.ts,.js}`
        );
        for (const filePath of eventsFiles) {
            const event: Event<keyof ClientEvents> = await ExtendedClient.importFile(filePath);
            Logger.info(`Loaded Event - ${event.event}`)
            this.on(event.event, event.run);
        }
    }

    async registerCommands() {
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = await globPromise(
            `${__dirname}/../commands/*/*{.ts,.js}`
        );
        for (const filePath of commandFiles) {
            const command: CommandType = await ExtendedClient.importFile(filePath);
            if (!command.name) continue;
            Logger.info(`Loaded Command - ${command.name}`);
            await this.commands.set(command.name, command);
            slashCommands.push(command);
        }

        this.on('ready', async () => {
            try {
                Logger.info(`Started refreshing application (/) commands.`);
                const guild = await this.guilds.fetch(this.config.ids.guild_id);
                guild.commands.set(slashCommands).then(async cmd => {
                    const fullPermissions = cmd.reduce((accumulator, x) => {
                        // @ts-ignore
                        const cmd: CommandType = slashCommands.find(u => u.name === x.name);
                        return [
                            ...accumulator,
                            {
                                id: x.id,
                                permissions: cmd.permissions
                            }
                        ];
                    }, []);

                    await guild.commands.permissions.set({fullPermissions});
                })

            } catch (e) {
                Logger.error(`Failed refreshing application (/)  commands.\n- ${e}`);
            } finally {
                Logger.success(`Successfully reloaded application (/) commands.`);
            }
        });
    }
}

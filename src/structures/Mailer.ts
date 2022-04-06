import Imap = require('imap');
import {Logger, Parser} from "../utils";
import {client} from "../index";
import {MessageEmbed, TextChannel} from "discord.js";
import {MailParser} from 'mailparser';
import {EventEmitter} from 'events';
import {MailerImapOptions, MailerOptions} from "../typings/Mailer";

export default class Mailer extends EventEmitter {

    private imap: Imap;

    private mailbox: string;
    public channel: TextChannel;
    private criteria: any[];

    constructor(options: MailerOptions) {
        super();

        this.mailbox = options.mailbox;

        client.channels.fetch(options.channelID).then(channel => {
            this.channel = channel as TextChannel;
        });

        this.criteria = ['UNSEEN', this.nestedFromOr(options.mails)];

        this.initImap(options.imap)
    }

    start() {
        this.imap.connect();
    };

    stop() {
        this.imap.end();
    }

    private nestedFromOr = (from: string | string[]): any[] => {
        let nestedFromOr;

        (Array.isArray(from) ? from : [from]).forEach((value, index) => {
            nestedFromOr = index
                ? ['OR', ['HEADER', 'FROM', value], nestedFromOr]
                : ['HEADER', 'FROM', value];
        });

        return nestedFromOr;
    };

    private initImap(options: MailerImapOptions) {
        this.imap = new Imap(options);
        this.imap.once('ready', () => this.imapReady());
        this.imap.once('close', () => this.imapClose());
        this.imap.on('error', (error) => this.imapError(error));
    }

    private imapReady() {
        this.imap.openBox(this.mailbox, false, (err, mailbox) => {
            if (err) this.imapError(err);
            else {
                this.emit('connected');
                this.imap.on('mail', () => this.imapMail());
                this.imap.on('update', () => this.imapMail());
            }
        })
    }

    private imapClose() {
        this.emit('disconnected');
    }

    private imapError(err) {
        this.emit('error', err);
    }

    private imapMail() {
        this.parseUnreadMessages();
    }

    private parseUnreadMessages() {
        this.imap.search(this.criteria, (err, results) => {
            if (err) this.emit('error', err);
            results.forEach(result => this.getMessage(result));
        });
    }

    private getMessage(uid) {
        this.imap.search([['UID', uid]], (err, results) => {
            if (err) this.emit('message:error', err);

            if (results.length > 0) {
                let messageFetchQuery = this.imap.fetch(results[0], {
                    markSeen: true,
                    bodies: ''
                });

                messageFetchQuery.on('message', (message, sequenceNumber) => {
                    let parser = new MailParser({});

                    let p = new Parser();

                    message.on('body', body => {
                        body.pipe(parser);
                    })

                    parser.on('headers', headers => p.parseHeaders(headers));

                    parser.on('data', data => p.parseMessageData(data));

                    parser.on('end', () => {
                        this.emit('message', p.getParseResult());
                    })

                    parser.on('error', error => this.imapError(error));
                });

                messageFetchQuery.on('error', err => this.imapError(err));
            }
        });
    }
}

export interface MailerOptions {
    imap: MailerImapOptions,
    mails: string[]
    mailbox: string
    channelID: string
}

export interface MailerImapOptions {
    user: string,
    password: string,
    host: string,
    port: number,
    tls: boolean,
}
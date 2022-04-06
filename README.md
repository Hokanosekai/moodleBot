# MoodleBot V2

A typescript discord.js bot to connect to Moodle Mail then send it to Discord

## How to use this?

1. Clone this repository
2. After done fill [config.json](./src/config/config.json) with your preferred ids
3. Add your bot token in [.env](./.env) file (if you haven't bot token go to the [Discord Developer Portal](https://discord.com/developers/applications) then create a new application)
4. Start command prompt in project folder
5. Run `npm install` to install all project dependencies

If you want to send only mails from certain sender you can edit the property mails in the mailer instance in [Client.ts L.53](./src/structures/Client.ts?plain=1=L53)

## Build project

Run command `npm run build` this will compile typescript in a `dist` folder in project folder.

## Start in dev mode

Edit the `APP_ENV` property by `dev` in the [.env](./.env) file. Then run in command prompt `npm run start:dev`.  
The bot will start and automatically restart if there is a change in your project folder.

## Start in live mode

Set `APP_ENV` at `live`, don't forget to fill the `config.json` live section with your ids and other info. Then run `npm run start:prod`. This will start the bot after finish to compile it. 

You can also start the bot without compile it by running `npm run start`.

> Note for this command you can replace `node` by `nodemon` to automatically restart bot on dist folder change.

Hokanosekai#0001

## Licence
MIT
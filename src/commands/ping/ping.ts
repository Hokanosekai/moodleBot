import {Command, UserApplication} from "../../structures";
import {Logger} from "../../utils";

export default new Command({
    name: 'ping',
    defaultPermission: true,
    description: "Ping test",

    options: [],
    permissions: [],

    run: async ({client, interaction}) => {
        Logger.test(interaction.type)
        await interaction.reply({
            content: `Bot ping is ${client.ws.ping}ms`
        })
    }
})
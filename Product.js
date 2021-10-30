const { MAIN_TOKEN, DATABASE_URL, DATABASE_NAME, SERVER_ID, STATUS } = require("./Configurations.json").DEFAULTS;
const { TOKENS } = require("./Configurations.json").SETTINGS;
const { getUpdate } = require("./Module.js");
const { Client, Intents } = require("discord.js");
const client = global.Client;

class ProductManager {
    static async loginProduct() {
        client.login(MAIN_TOKEN).then(async () => {
            return await getUpdate(client.guilds.cache.get(SERVER_ID));
        }, console.log(`Main task is complated!`));
        let Bot;
        for(const key of TOKENS) {
            Bot = new Client({ intents: [32767] }), Bot.Busy = false, Bot.Task = 0;
            Bot.on("ready", () => {
                global.Bots.push(Bot);
                Bot.user.setPresence({ activities: [{ name: STATUS }] });
            });
            void Bot.login(key).catch(() => console.log(`${key.substring(Math.floor(key.length / 2))} will halt!`));
        };
    }
}

module.exports = ProductManager;

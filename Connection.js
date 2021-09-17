const { MAIN_TOKEN, DATABASE_URL, DATABASE_NAME, SERVER_ID, STATUS } = require("./Configurations.json").DEFAULTS;
const { TOKENS } = require("./Configurations.json").SETTINGS;
const { roleBackup, channelBackup } = require("./Module.js");
const { Client, Intents } = require("discord.js");
const client = global.Client;
const Mongoose = require("mongoose");

Mongoose.connect(DATABASE_URL.replace("<dbname>", DATABASE_NAME), {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

Mongoose.connection.once("open", async () => {
  client.login(MAIN_TOKEN).then(async function(){
    await roleBackup(client.guilds.cache.get(SERVER_ID));
    await channelBackup(client.guilds.cache.get(SERVER_ID));
    console.log(`[SUCCESSFUL] Main bot is ready!`);
  });
  TOKENS.forEach(function(requirement){
    let Bot = new Client({ intents: Object.values(Intents.FLAGS) })
    Bot.on("ready", () => {
      Bot.Busy = false;
      Bot.Task = 0;
      global.Bots.push(Bot);
      console.log(`[SUPPORTER] ${Bot.user.tag} is ready!`);
      Bot.user.setPresence({ activities: [{ name: STATUS }] });
    });
    Bot.login(requirement).catch(() => {
      console.error(`${requirement.substring(Math.floor(requirement.length / 2))} is error!`);
    });
  });
});

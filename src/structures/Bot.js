const DJS = require("discord.js");
const mongoose = require("mongoose");
const { GatewayIntentBits } = require("discord-api-types/v10");
const EventHandler = require("../handlers/EventHandler");
const Util = require("../utils/Util");
const Resolvers = require("../utils/Resolvers");
const Winston = require("../utils/Winston");
const Config = require("../../Config");

class Bot extends DJS.Client {
  constructor() {
    super({
      intents: [
        Object.values(GatewayIntentBits).reduce((acc, p) => acc | p, 0),
      ],
    });

    new EventHandler(this).loadEvents();
    this.util = new Util(this);
    this.resolvers = new Resolvers(this);
    this.winston = new Winston(this);
    this.buildMongoose();
    this.util.loginToSup();
    this.danger = false;
  }
  
  async buildMongoose() {
    const Options = {
      useNewUrlParser: true,
      autoIndex: false,
      connectTimeoutMS: 10000,
      family: 4,
      noDelay: true,
      maxPoolSize: 10,
      keepAlive: true, 
      keepAliveInitialDelay: 300000
    };
    
    mongoose.connect(Config.MONGO_URL, Options);
    mongoose.Promise = global.Promise;
    
    mongoose.connection.on("connected", () => {
      this.winston.info("Connected to db successfully");
    });

    mongoose.connection.on("err", (err) => {
      this.winston.error(`Mongoose connection error ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      this.winston.warn("Mongoose has disconnected from db");
    });
  }
}

module.exports = Bot;

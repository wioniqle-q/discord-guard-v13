const {DEFAULTS} = require("./Configurations.json");
const { DATABASE_URL, DATABASE_NAME } = DEFAULTS;
const {loginProduct} = require("./Product.js");
let Mongoose;
Mongoose = require("mongoose");

Mongoose.connect(DATABASE_URL.replace("<dbname>", DATABASE_NAME), { useNewUrlParser: true, useUnifiedTopology: true });

Mongoose.connection.once("open", async () => {
    await loginProduct();
});

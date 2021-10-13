const { DATABASE_URL, DATABASE_NAME } = require("./Configurations.json").DEFAULTS;
const Product = require("./Product.js");
const Mongoose = require("mongoose");

Mongoose.connect(DATABASE_URL.replace("<dbname>", DATABASE_NAME), { useNewUrlParser: true, useUnifiedTopology: true });

Mongoose.connection.once("open", async () => {
  await Product.loginProduct();
});

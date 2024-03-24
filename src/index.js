const connectDB = require("./Config/databaseConfig");
const { PORT } = require("./Config/serverConfig");
const app = require("./app");

connectDB()
  .then(() => {
    app.listen(PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

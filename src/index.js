const { PORT } = require("./Config/serverConfig");
const app = require("./app");

app.listen(PORT, () => {
  console.log(`server is listening at ${PORT}`);
});

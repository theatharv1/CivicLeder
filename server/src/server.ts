import { assertConfig, config } from "./config/env.js";
import { createApp } from "./app.js";

assertConfig();
const app = createApp();
app.listen(config.port, () => {
  console.log(`CivicLeder API listening on http://localhost:${config.port}`);
});

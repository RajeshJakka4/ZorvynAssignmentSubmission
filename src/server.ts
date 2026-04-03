import { createApp } from "./app";
import { getConfig } from "./config/env";
import { createDatabase } from "./db/database";

const config = getConfig();
const db = createDatabase(config.databasePath);
const app = createApp(db);

app.listen(config.port, () => {
  console.log(`Finance backend listening on http://localhost:${config.port}`);
});

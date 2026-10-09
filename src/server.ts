import app from "./app";
import env from "./config/env";
import connectDB from "./config/database";

const PORT = env.port;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`App is listening on ${PORT}`);
  });
};

startServer();

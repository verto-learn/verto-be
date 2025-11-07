import express from 'express';
import cookieParser from "cookie-parser";
import router from './features/v1.routes';

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Verto API",
  });
});

export default app;
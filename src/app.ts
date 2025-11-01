import express from 'express';
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Verto API",
  });
});

export default app;
import express from 'express';
import cookieParser from "cookie-parser";
import router from './features/v1.routes';
import cors from "cors";
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "https://verto-fe.vercel.app"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Verto API",
  });
});

app.use(errorHandler)

export default app;
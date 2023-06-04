/* global process */
import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sessionMiddleware from "./middleware/session.js";
import rateLimiter from "./middleware/rateLimiter.js";
import apiRouter from "./routes/index.js";
import corsOptions from "./middleware/cors.js";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const COOKIE_SECRET = process.env.COOKIE_SECRET || "secret";
const PROD_MODE = process.env.NODE_ENV === "production";

const STATIC_FOLDER = path.join(__dirname, PROD_MODE ? "../dist" : "../public");

const app = express();

// enable cors
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));

// apply middleware
app.use(rateLimiter);
app.use(sessionMiddleware);

// serve static files from client directory
app.use(express.static(STATIC_FOLDER));

// apply routes
app.use("/api", apiRouter);

// default route
app.get("/", (req, res) => {
  const filePath = PROD_MODE
    ? path.join(__dirname, `${STATIC_FOLDER}/index.html`)
    : path.join(__dirname, "../index.html");
  return res.sendFile(filePath);
});

export default app;

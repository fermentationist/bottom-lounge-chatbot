require("dotenv").config();
const { join } = require("path");

const PROD_MODE = process.env.NODE_ENV === "production";
const cachePath = join(__dirname, "../.cache", "puppeteer");

const config = PROD_MODE ? {
  // Changes the cache location for Puppeteer.
  cacheDirectory: cachePath,
} : {};

module.exports = config;

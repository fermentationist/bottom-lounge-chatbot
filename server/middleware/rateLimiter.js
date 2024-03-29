import rateLimit from "express-rate-limit";

const MAX_REQUESTS = 60;
const REQUEST_LIMIT_WINDOW = 1000 * 60 * 60; // 1 hour

const rate = MAX_REQUESTS / (REQUEST_LIMIT_WINDOW / (1000 * 60 * 60)); // rate per hour
const rateLimitConfig = {
  windowMs: REQUEST_LIMIT_WINDOW,
  max: MAX_REQUESTS,
  standardHeaders: true,
  message: {
    error: `Too many requests from this user. Maximum of ${rate} per hour.`,
  },
  keyGenerator: (req) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",").shift() ||
      req.socket.remoteAddress;
    console.log(`${new Date().toISOString()}: ${ip}`);
    return ip;
  },
};

const rateLimiter = rateLimit(rateLimitConfig);

export default rateLimiter;

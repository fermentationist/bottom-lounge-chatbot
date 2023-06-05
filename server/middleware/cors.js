/* global process */
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",")?.map(x => x.trim()) || [];

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, !origin || ALLOWED_ORIGINS.includes(origin))
  }
}
const getCorsOptions = (req) => {
  const origin = req.headers.origin;
  return {
    origin: ALLOWED_ORIGINS.includes(origin) ? origin : origin ? "" : "all",
    credentials: true,
  };
};

export default corsOptions;
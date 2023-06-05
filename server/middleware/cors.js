/* global process */
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(",")?.map((x) => x.trim()) || [];

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, !origin || ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true,
};

export default corsOptions;

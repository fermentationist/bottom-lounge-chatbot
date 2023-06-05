/* global process */
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(",")?.map((x) => x.trim()) || [];

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, !origin || ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true,
  maxAge: 86400,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  // allowedHeaders: [ "*", "Authorization" ],
  exposedHeaders: ["Authorization"],
};

export default corsOptions;

import { v4 as uuidv4 } from 'uuid';

const sessionMiddleware = (req, res, next) => {
  // get sessionId from cookie or create new one
  let { sessionId } = req.cookies;
  if (!sessionId) {
    sessionId = uuidv4();
  }
  // set cookie
  res.cookie("sessionId", sessionId, {
    maxAge: 1000 * 60 * 60 * 24 * 1,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  // set headers
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "*, Authorization");
  res.header("Access-Control-Expose-Headers", "Authorization");
  req.sessionId = sessionId;
  next();
}

export default sessionMiddleware;
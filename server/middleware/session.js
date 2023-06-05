import { v4 as uuidv4 } from 'uuid';

const sessionMiddleware = (req, res, next) => {
  let { sessionId } = req.cookies;
  console.log("sessionId in cookie:", sessionId);
  if (!sessionId) {
    sessionId = uuidv4();
  }
  res.cookie("sessionId", sessionId, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
  });
  res.header("Access-Control-Allow-Credentials", true);
  req.sessionId = sessionId;
  next();
}

export default sessionMiddleware;
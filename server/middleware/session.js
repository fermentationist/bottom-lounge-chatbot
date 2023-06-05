import { v4 as uuidv4 } from 'uuid';

const sessionMiddleware = (req, res, next) => {
  let { sessionIdFromCookie } = req.cookies;
  console.log("sessionIdFromCookie:", sessionIdFromCookie);
  const [_, sessionIdFromHeader] = req.headers.cookie?.split("sessionId=") ?? [];
  console.log("sessionIdFromHeader:", sessionIdFromHeader);
  let sessionId = sessionIdFromCookie ?? sessionIdFromHeader;

  if (!sessionId) {
    sessionId = uuidv4();
  }
  res.cookie("sessionId", sessionId, {
    maxAge: 1000 * 60 * 60 * 24 * 1,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "*, Authorization");
  res.header("Access-Control-Expose-Headers", "Authorization");
  req.sessionId = sessionId;
  next();
}

export default sessionMiddleware;
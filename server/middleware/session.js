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
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.header("Access-Control-Allow-Credentials", true);
  req.sessionId = sessionId;
  next();
}

export default sessionMiddleware;
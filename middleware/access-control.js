import jwt from "jsonwebtoken";

function authenticateAdmin(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Token is required." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admins only" });
    }

    req.user = user;
    next();
  });
}

export default authenticateAdmin;

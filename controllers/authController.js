const prisma = require("../prisma");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

//is admin function
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
};

//Logged in user function
const isLoggedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return next({
        status: 401,
        message: "Unauthorized: No token provided",
      });
    }

    //extract token
    const token = authHeader.split(" ")[1];

    //verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid Token" });
  }
};

//create a new user
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        password: hashedPassword,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Username or email already exists." });
    }
    next(error);
  }
};

//authenticate user/token
const authenticate = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    //error handling
    if (!username || !password) {
      return res.status(404).json({
        status: "error",
        message: "Username or password is required.",
      });
    }

    //find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    //error handling
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    //error handling
    if (!isPasswordValid) {
      return res.status(404).json({
        status: "error",
        message: "Invalid username or password",
      });
    }

    //create token payload
    const payload = {
      userId: user.userId,
      username: user.username,
      role: user.role,
    };

    //sign token with secret
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "15m", //length token is valid
    });
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d", //length refresh token is valid
    });

    //save refresh token to database
    await prisma.user.update({
      where: { userId: user.userId },
      data: { refreshToken },
    });

    //respond with token
    return res.status(200).json({
      status: "success",
      message: "Authenticated successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Authentication error: ", error.message);

    return res.status(500).json({
      status: "error",
      message: "An internal server error occured",
    });
  }
};

//helper function to create notification
async function createNotification(userId, projectId, type, message) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        projectId,
        type,
        message,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
}

module.exports = {
  createUser,
  authenticate,
  isLoggedIn,
  isAdmin,
  createNotification,
};

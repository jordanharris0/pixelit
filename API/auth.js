const router = require("express").Router();
module.exports = router;
const {
  createUser,
  authenticate,
  isLoggedIn,
} = require("../controllers/authController");
// const cache = require("../middleware/cache");

const prisma = require("../prisma");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

//login limiter
const loginLimiter = rateLimit({
  windowsMs: 15 * 60 * 1000, //15 minutes
  max: 5, //li,it on login attempts
  message: "Too many login attempts, please try again in 15 minutes.",
});

//<---------- v handles register, login, token refresh, logout v ---------->

//create new user - see authController.js
router.post("/register", createUser);

//authenticate login - see authController.js
router.post("/login", loginLimiter, authenticate);

//refresh user token
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: "Refresh token missing" });
  }

  try {
    //verify refresh token
    const payload = jwt.verify(refreshToken, JWT_SECRET);

    //retrieve the user’s saved refresh token from the database
    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    //generate a new access token
    const newAccessToken = jwt.sign(
      { userId: user.userId, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    //respond with the new access token
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

//clear refresh token on logout
router.post("/logout", isLoggedIn, async (req, res) => {
  await prisma.user.update({
    where: { userId: req.user.userId },
    data: { refreshToken: null },
  });
  res.status(200).json({ message: "Logged out successfully" });
});

//<-------------------- ^^^^^^ -------------------->

//<---------- v handles account related routes v ---------->

//get auth users account
router.get("/account", isLoggedIn, async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { userId: req.user.userId },
  });
  res.json(user);
});

//updater account info
router.patch("/account", isLoggedIn, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    //check if the user exists
    const userExists = await prisma.user.findUnique({ where: { userId } });

    if (!userExists) {
      return next({
        status: 404,
        message: `Could not find user with ID ${userId}`,
      });
    }

    //destructure fields from the request body
    const { firstName, lastName, username, email, bio, profilePicture } =
      req.body;

    //check if at least one field is provided for update
    if (
      !firstName &&
      !lastName &&
      !username &&
      !email &&
      !bio &&
      !profilePicture
    ) {
      return next({
        status: 422,
        message: "At least one field is required to update account information",
      });
    }

    //build the updated data object with only provided fields
    const updatedData = {};
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (username) updatedData.username = username;
    if (email) updatedData.email = email;
    if (bio) updatedData.bio = bio;
    if (profilePicture) updatedData.profilePicture = profilePicture;

    //perform the update
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updatedData,
    });

    //respond with the updated user data
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error.message);
    next({
      status: 500,
      message: "Failed to update account information",
    });
  }
});

//delete account
router.delete("/account", isLoggedIn, async (req, res) => {
  try {
    await prisma.user.delete({
      where: { userId: req.user.userId },
    });
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Failed to delete account." });
  }
});

//update account password
router.patch("/account/password", isLoggedIn, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new passwords are required." });
  }

  try {
    //find the user by their ID from the session
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
    });

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    //fash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { userId: req.user.userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).json({ message: "Failed to update password." });
  }
});

//<-------------------- ^^^^^^ -------------------->

const router = require("express").Router();
module.exports = router;
const {
  createUser,
  authenticate,
  isLoggedIn,
} = require("../controllers/authController");
// const cache = require("../middleware/cache");

const {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const s3 = require("../controllers/s3Client");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const prisma = require("../prisma");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

//login limiter
const loginLimiter = rateLimit({
  windowsMs: 15 * 60 * 1000, //15 minutes
  max: 5, //limit on login attempts
  message: "Too many login attempts, please try again in 15 minutes.",
});

//<---------- v handles register, login, token refresh, logout v ---------->

//create new user - see authController.js -- WORKS
router.post("/register", createUser);

//authenticate login - see authController.js -- WORKS
router.post("/login", loginLimiter, authenticate);

//refresh user token -- WORKS
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

    //testing
    console.log("User record:", user);
    console.log("User's stored refresh token:", user?.refreshToken);

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

//clear refresh token on logout -- WORKS
router.post("/logout", isLoggedIn, async (req, res) => {
  await prisma.user.update({
    where: { userId: req.user.userId },
    data: { refreshToken: null },
  });
  res.status(200).json({ message: "Logged out successfully" });
});

//<-------------------- ^^^^^^ -------------------->

//<---------- v handles account related routes v ---------->

//get auth users account -- WORKS
router.get("/account", isLoggedIn, async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { userId: req.user.userId },
  });
  res.json(user);
});

//updater account info -- WORKS
router.patch(
  "/account",
  isLoggedIn,
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, username, email, bio } = req.body;
      const file = req.file;

      //check if the user exists
      const userExists = await prisma.user.findUnique({ where: { userId } });

      if (!userExists) {
        return next({
          status: 404,
          message: `Could not find user with ID ${userId}`,
        });
      }

      //check if at least one field is provided for update
      if (!firstName && !lastName && !username && !email && !bio && !file) {
        return next({
          status: 422,
          message:
            "At least one field is required to update account information",
        });
      }

      //build the updated data object with only provided fields
      const updatedData = {};

      if (firstName) updatedData.firstName = firstName;
      if (lastName) updatedData.lastName = lastName;
      if (username) updatedData.username = username;

      //validate email format
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format." });
        }

        // Check for unique email
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });
        if (emailExists && emailExists.userId !== userId) {
          return res.status(400).json({ message: "Email already in use." });
        }

        updatedData.email = email;
      }

      if (bio) updatedData.bio = bio;

      //if a file is uploaded, handle S3 upload and update profilePicture URL
      if (file) {
        //delete existing profile picture from S3 if it exists
        if (userExists.profilePicture) {
          const oldKey = userExists.profilePicture
            .split("/")
            .slice(-2)
            .join("/");
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: oldKey,
            })
          );
        }

        //define S3 upload parameters for the new profile picture
        const s3Params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `profile-pictures/${userId}_${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        //upload new profile picture to S3
        await s3.send(new PutObjectCommand(s3Params));
        updatedData.profilePicture = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;
      }

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
  }
);

//delete account -- WORKS
router.delete("/account", isLoggedIn, async (req, res) => {
  const userId = req.user.userId;

  try {
    //fetch user details
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        profilePicture: true,
        projects: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const deleteS3Files = [];

    //delete profile pictures from S3
    if (user.profilePicture) {
      const profilePictureKey = user.profilePicture
        .split("/")
        .slice(-2)
        .join("/");
      deleteS3Files.push(
        s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: profilePictureKey,
          })
        )
      );
    }

    //delete projects and associated S3 files
    for (const project of user.projects) {
      const projectFolderKey = `projects/${project.projectId}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: projectFolderKey,
      });

      const listedObjects = await s3.send(listCommand);

      if (listedObjects.Contents) {
        for (const object of listedObjects.Contents) {
          deleteS3Files.push(
            s3.send(
              new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: object.Key,
              })
            )
          );
        }
      }
    }

    //delete templates from the user
    for (const project of user.projects) {
      const templateFolderKey = `templates/${project.projectId}/`;
      const listedTemplates = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_BUCKET_NAME,
          Prefix: templateFolderKey,
        })
      );

      if (listedTemplates.Contents && listedTemplates.Contents.length > 0) {
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: {
            Objects: [
              ...listedTemplates.Contents.map((object) => ({
                Key: object.Key,
              })),
              { Key: templateFolderKey }, //explicitly include the folder key
            ],
          },
        };

        await s3.send(new DeleteObjectsCommand(deleteParams));
        console.log(`Templates for project ${project.projectId} deleted.`);
      }
    }

    //wait for all S3 deletions to complete
    await Promise.all(deleteS3Files);

    await prisma.user.delete({
      where: { userId: req.user.userId },
    });
    res
      .status(200)
      .json({ message: "Account and associated data deleted successfully." });
  } catch (error) {
    console.error("Error deleting account and S3 files:", error.message);
    res.status(500).json({ message: "Failed to delete account." });
  }
});

//update account password -- WORKS
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

//update user settings -- WORKS
router.patch("/settings", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;
  const { notificationsEnabled } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { notificationsEnabled },
    });
    res.json({ message: "Settings updated successfully.", updatedUser });
  } catch (error) {
    console.error("Error updating settings: ", error.message);
    next(error);
  }
});

//update privacy settings -- WORKS
router.patch("/privacy", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;
  const { showBookmarks, showDownloadHistory } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { showBookmarks, showDownloadHistory },
    });
    res.json({ message: "Privacy setting updated successfully.", updatedUser });
  } catch (error) {
    console.error("Error updating privacy settings: ", error.message);
    next(error);
  }
});

//user analytics -- WORKS
router.get("/:userId/analytics", isLoggedIn, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const analytics = {
      totalLikes: await prisma.like.count({ where: { project: { userId } } }),
      totalDownloads: await prisma.download.count({
        where: { project: { userId } },
      }),
      totalBookmarks: await prisma.bookmark.count({
        where: { project: { userId } },
      }),
      mostDownloadedProjects: await prisma.project.findMany({
        where: { userId },
        orderBy: { downloadCount: "desc" },
        take: 5,
      }),
    };
    res.json(analytics);
  } catch (error) {
    console.error("Error fecthing analytics: ", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles User Activity Routes ---------->

//get users recent activity -- WORKS
router.get("/users/:userId/activity", isLoggedIn, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const likes = await prisma.like.findMany({
      where: { userId },
      include: {
        project: { select: { title: true, projectId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const comments = await prisma.comment.findMany({
      where: { userId },
      include: {
        project: { select: { title: true, projectId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const downloads = await prisma.download.findMany({
      where: { userId },
      include: {
        project: { select: { title: true, projectId: true } },
      },
      orderBy: { downloadedAt: "desc" },
      take: 10,
    });

    res.json({ likes, comments, downloads });
  } catch (error) {
    console.error("Error fetching user activity:", error.message);
    next(error);
  }
});

//get popularity metrics of a project  -- WORKS
router.get("/projects/:projectId/metrics", async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const metrics = await prisma.project.findUnique({
      where: { projectId },
      select: {
        downloadCount: true,
        bookmarkCount: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!metrics) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching project metrics:", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles User Content Reports ---------->

//report a project -- WORKS
router.post("/reports", isLoggedIn, async (req, res, next) => {
  const { projectId, reason } = req.body;
  const userId = req.user.userId;

  try {
    //check if the project exists
    const project = await prisma.project.findUnique({
      where: { projectId },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    //create a report entry
    const report = await prisma.report.create({
      data: { userId, projectId, reason },
    });

    res.status(201).json({ message: "Report submitted successfully.", report });
  } catch (error) {
    console.error("Error reporting project:", error.message);
    next(error);
  }
});

//report a comment -- WORKS
router.post("/comments/report", isLoggedIn, async (req, res, next) => {
  const { commentId, reason } = req.body;
  const userId = req.user.userId;

  try {
    const comment = await prisma.comment.findUnique({
      where: { commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const report = await prisma.report.create({
      data: { userId, commentId, reason },
    });

    res
      .status(201)
      .json({ message: "Comment report submitted successfully.", report });
  } catch (error) {
    console.error("Error reporting comment:", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

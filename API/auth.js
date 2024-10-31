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
  max: 5, //limit on login attempts
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

//<---------- v Handles Project Routes v ---------->

//create new project for logged in user
router.post("/projects", isLoggedIn, async (req, res, next) => {
  const { title, description, isPublic } = req.body;
  const userId = req.user.userId;

  try {
    const newProject = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        isPublic: isPublic || false, //defaults to false if not provided
      },
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error.message);
    next(error);
  }
});

//get all projects for logged in user
router.get("/projects", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
    });

    res.json(projects);
  } catch (error) {
    console.error("Error retrieving projects:", error.message);
    next(error);
  }
});

//update project details for logged in user
router.patch("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, isPublic } = req.body;
  const userId = req.user.userId;

  try {
    //check if project exists and belongs to the user
    const project = await prisma.project.findUnique({ where: { projectId } });
    if (!project || project.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this project." });
    }

    const updatedProject = await prisma.project.update({
      where: { projectId },
      data: {
        title,
        description,
        isPublic,
      },
    });

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error.message);
    next(error);
  }
});

//delete a project
router.delete("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.userId;

  try {
    //check if project exists and belongs to the user
    const project = await prisma.project.findUnique({ where: { projectId } });
    if (!project || project.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this project." });
    }

    await prisma.project.delete({
      where: { projectId },
    });

    res.status(204).send(); //successfully deleted
  } catch (error) {
    console.error("Error deleting project:", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

//<---------- v Handles Canvas Data Routes v ---------->

//create new canvas data for a project
router.post(
  "/projects/:projectId/canvas",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { frameNumber, width, height, pixels } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add canvas data to this project.",
        });
      }

      //create new canvas data entry
      const newCanvasData = await prisma.canvasData.create({
        data: {
          projectId,
          frameNumber,
          width,
          height,
          pixels,
        },
      });

      res.status(201).json(newCanvasData);
    } catch (error) {
      console.error("Error creating canvas data:", error.message);
      next(error);
    }
  }
);

//update canvas data on a project
router.patch(
  "/projects/:projectId/canvas/:canvasId",
  isLoggedIn,
  async (req, res, next) => {
    const { canvasId } = req.params;
    const { frameNumber, width, height, pixels } = req.body;
    const userId = req.user.userId;

    try {
      //check if the canvas and project exist and belong to the user
      const canvasData = await prisma.canvasData.findUnique({
        where: { canvasId },
        include: { project: true },
      });

      if (!canvasData || canvasData.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this canvas data." });
      }

      //update the canvas data
      const updatedCanvasData = await prisma.canvasData.update({
        where: { canvasId },
        data: { frameNumber, width, height, pixels },
      });

      res.json(updatedCanvasData);
    } catch (error) {
      console.error("Error updating canvas data:", error.message);
      next(error);
    }
  }
);

//delete canvas data fro a project
router.delete(
  "/projects/:projectId/canvas/:canvasId",
  isLoggedIn,
  async (req, res, next) => {
    const { canvasId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the canvas and project exist and belong to the user
      const canvasData = await prisma.canvasData.findUnique({
        where: { canvasId },
        include: { project: true },
      });

      if (!canvasData || canvasData.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this canvas data." });
      }

      //delete the canvas data
      await prisma.canvasData.delete({
        where: { canvasId },
      });

      res.status(204).send(); //successfully deleted with no content
    } catch (error) {
      console.error("Error deleting canvas data:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

//<---------- v Handles Liking and Commenting Routes v ---------->

//liking a project
router.post("/projects/:projectId/like", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.userId;

  try {
    //check if the project exists
    const project = await prisma.project.findUnique({ where: { projectId } });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    //check if the like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (existingLike) {
      //if like exists, delete it (unlike)
      await prisma.like.delete({
        where: {
          likeId: existingLike.likeId,
        },
      });
      return res.status(200).json({ message: "Project unliked." });
    } else {
      //if like does not exist, create it
      const like = await prisma.like.create({
        data: { userId, projectId },
      });
      return res.status(201).json(like);
    }
  } catch (error) {
    console.error("Error toggling like on project:", error.message);
    next(error);
  }
});

//creating a comment on a project
router.post(
  "/projects/:projectId/comment",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      const comment = await prisma.comment.create({
        data: {
          userId,
          projectId,
          content,
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error.message);
      next(error);
    }
  }
);

//getting comments on a project
router.get("/projects/:projectId/comments", async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    console.error("Error retrieving comments:", error.message);
    next(error);
  }
});

//update comment on a project
router.patch(
  "/projects/:projectId/comments/:commentId",
  isLoggedIn,
  async (req, res, next) => {
    const { commentId } = req.params;
    const { content } = req.body; //the updated content for the comment
    const userId = req.user.userId;

    try {
      //check if the comment exists and belongs to the user
      const comment = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to edit this comment." });
      }

      //update the comment content
      const updatedComment = await prisma.comment.update({
        where: { commentId },
        data: { content },
      });

      res.json(updatedComment);
    } catch (error) {
      console.error("Error editing comment:", error.message);
      next(error);
    }
  }
);

//deleting a comment the user made
router.delete(
  "/projects/:projectId/comments/:commentId",
  isLoggedIn,
  async (req, res, next) => {
    const { commentId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the comment exists and belongs to the user
      const comment = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this comment." });
      }

      //delete the comment
      await prisma.comment.delete({
        where: { commentId },
      });

      res.status(204).send(); //successfully deleted with no content
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles Bookmark Routes ---------->

//create bookmark on an project
router.post(
  "/projects/:projectId/bookmark",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      //check if the bookmark already exists
      const existingBookmark = await prisma.bookmark.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });

      if (existingBookmark) {
        //if bookmark exists, delete it (unbookmark)
        await prisma.bookmark.delete({
          where: { bookmarkId: existingBookmark.bookmarkId },
        });
        return res.status(200).json({ message: "Project unbookmarked." });
      } else {
        //if bookmark does not exist, create it
        const bookmark = await prisma.bookmark.create({
          data: { userId, projectId },
        });
        return res.status(201).json(bookmark);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error.message);
      next(error);
    }
  }
);

//get all bookmarks for logged in user
router.get("/user/bookmarks", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { project: true },
    });

    res.json(bookmarks.map((bookmark) => bookmark.project));
  } catch (error) {
    console.error("Error retrieving bookmarks:", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles Collaboration Routes ---------->

//add collaborator to a project
router.post(
  "/projects/:projectId/collaborators",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { userId: collaboratorId, role } = req.body; //collaboratorId is the user to add
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add collaborators to this project.",
        });
      }

      //add collaborator
      const collaboration = await prisma.collaboration.create({
        data: { projectId, userId: collaboratorId, role },
      });

      res.status(201).json(collaboration);
    } catch (error) {
      console.error("Error adding collaborator:", error.message);
      next(error);
    }
  }
);

//update collaborator roles
router.patch(
  "/projects/:projectId/collaborators/:collaboratorId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to update collaborators on this project.",
        });
      }

      const updatedCollaboration = await prisma.collaboration.update({
        where: { userId_projectId: { userId: collaboratorId, projectId } },
        data: { role },
      });

      res.json(updatedCollaboration);
    } catch (error) {
      console.error("Error updating collaborator role:", error.message);
      next(error);
    }
  }
);

//deletes a collaborator from a project
router.delete(
  "/projects/:projectId/collaborators/:collaboratorId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, collaboratorId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to remove collaborators from this project.",
        });
      }

      await prisma.collaboration.delete({
        where: { userId_projectId: { userId: collaboratorId, projectId } },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error removing collaborator:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles Animation Routes ---------->

//create animation settings for a project
router.post(
  "/projects/:projectId/animation",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { frameRate, loop, exportFormat } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add animation settings to this project.",
        });
      }

      //check if animation settings already exist for this project
      const existingAnimation = await prisma.animationSetting.findUnique({
        where: { projectId },
      });
      if (existingAnimation) {
        return res.status(400).json({
          message: "Animation settings already exist for this project.",
        });
      }

      //create animation settings
      const animationSetting = await prisma.animationSetting.create({
        data: { projectId, frameRate, loop, exportFormat },
      });

      res.status(201).json(animationSetting);
    } catch (error) {
      console.error("Error creating animation settings:", error.message);
      next(error);
    }
  }
);

//update animation settings for a project
router.patch(
  "/projects/:projectId/animation",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { frameRate, loop, exportFormat } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message:
            "Unauthorized to update animation settings for this project.",
        });
      }

      //update the animation settings
      const updatedAnimationSetting = await prisma.animationSetting.update({
        where: { projectId },
        data: { frameRate, loop, exportFormat },
      });

      res.json(updatedAnimationSetting);
    } catch (error) {
      console.error("Error updating animation settings:", error.message);
      next(error);
    }
  }
);

//get animation settings for a project
router.get(
  "/projects/:projectId/animation",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to view animation settings for this project.",
        });
      }

      const animationSetting = await prisma.animationSetting.findUnique({
        where: { projectId },
      });
      if (!animationSetting) {
        return res
          .status(404)
          .json({ message: "Animation settings not found for this project." });
      }

      res.json(animationSetting);
    } catch (error) {
      console.error("Error retrieving animation settings:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles Template Layer Routes ---------->

//create a template layer for a project
router.post(
  "/projects/:projectId/template-layer",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const {
      imageUrl,
      opacity,
      isLocked,
      positionX,
      positionY,
      scale,
      flipHorizontal,
      flipVertical,
      rotation,
    } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add template layers to this project.",
        });
      }

      const templateLayer = await prisma.templateLayer.create({
        data: {
          projectId,
          imageUrl,
          opacity,
          isLocked,
          positionX,
          positionY,
          scale,
          flipHorizontal,
          flipVertical,
          rotation,
        },
      });

      res.status(201).json(templateLayer);
    } catch (error) {
      console.error("Error creating template layer:", error.message);
      next(error);
    }
  }
);

//updates template layer for a project
router.patch(
  "/projects/:projectId/template-layer/:layerId",
  isLoggedIn,
  async (req, res, next) => {
    const { layerId } = req.params;
    const {
      opacity,
      isLocked,
      positionX,
      positionY,
      scale,
      flipHorizontal,
      flipVertical,
      rotation,
    } = req.body;
    const userId = req.user.userId;

    try {
      //check if the layer exists and belongs to a project owned by the user
      const templateLayer = await prisma.templateLayer.findUnique({
        where: { templateLayerId: layerId },
        include: { project: true },
      });

      if (!templateLayer || templateLayer.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this template layer." });
      }

      const updatedTemplateLayer = await prisma.templateLayer.update({
        where: { templateLayerId: layerId },
        data: {
          opacity,
          isLocked,
          positionX,
          positionY,
          scale,
          flipHorizontal,
          flipVertical,
          rotation,
        },
      });

      res.json(updatedTemplateLayer);
    } catch (error) {
      console.error("Error updating template layer:", error.message);
      next(error);
    }
  }
);

//deletes template layer for a project
router.delete(
  "/projects/:projectId/template-layer/:layerId",
  isLoggedIn,
  async (req, res, next) => {
    const { layerId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the layer exists and belongs to a project owned by the user
      const templateLayer = await prisma.templateLayer.findUnique({
        where: { templateLayerId: layerId },
        include: { project: true },
      });

      if (!templateLayer || templateLayer.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this template layer." });
      }

      await prisma.templateLayer.delete({
        where: { templateLayerId: layerId },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template layer:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

//<---------- Handles Download Activity Routes ---------->

//track download activity for a project
router.post(
  "/projects/:projectId/download",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      //increment download count
      await prisma.project.update({
        where: { projectId },
        data: { downloadCount: { increment: 1 } },
      });

      //log download event in the Download table
      const download = await prisma.download.create({
        data: { userId, projectId },
      });

      res.status(200).json({
        message: "Download tracked successfully.",
        downloadCount: project.downloadCount + 1, //incremented count for response
        download,
      });
    } catch (error) {
      console.error("Error tracking download:", error.message);
      next(error);
    }
  }
);

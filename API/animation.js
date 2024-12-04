const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- Handles Animation Routes ---------->

//get all animations for a project -- WORKS
router.get(
  "/projects/:projectId/animations",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({ where: { projectId } });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to view animations for this project.",
        });
      }

      const animations = await prisma.animation.findMany({
        where: { projectId },
        include: { settings: true },
      });

      res.json(animations);
    } catch (error) {
      console.error("Error fetching animations:", error.message);
      next(error);
    }
  }
);

//create a new animation -- WORKS
router.post(
  "/projects/:projectId/animations",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { name, frames, frameRate, loop, exportFormat } = req.body;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({ where: { projectId } });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to create an animation for this project.",
        });
      }

      //create the Animation
      const animation = await prisma.animation.create({
        data: {
          projectId,
          name,
          frames: JSON.stringify(frames),
        },
      });

      //create Animation Settings
      const settings = await prisma.animationSetting.create({
        data: {
          animationId: animation.animationId,
          frameRate,
          loop,
          exportFormat,
          isPublic: false, // Default to private
          isDraft: true, // Default to draft
        },
      });

      res.status(201).json({
        message: "Animation created successfully.",
        animation,
        settings,
      });
    } catch (error) {
      console.error("Error creating animation:", error.message);
      next(error);
    }
  }
);

//update an animation for a project -- WORKS
router.patch(
  "/projects/:projectId/animations/:animationId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, animationId } = req.params;
    const { name, frames, frameRate, loop, exportFormat, isPublic, isDraft } =
      req.body;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({ where: { projectId } });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to update this animation.",
        });
      }

      //update animation and settings
      const animation = await prisma.animation.update({
        where: { animationId },
        data: {
          name,
          frames: frames ? JSON.stringify(frames) : undefined,
          settings: {
            update: {
              frameRate,
              loop,
              exportFormat,
              isPublic,
              isDraft,
            },
          },
        },
        include: { settings: true },
      });

      res.json(animation);
    } catch (error) {
      console.error("Error updating animation:", error.message);
      next(error);
    }
  }
);

//delete an animation -- WORKS
router.delete(
  "/projects/:projectId/animations/:animationId",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, animationId } = req.params;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({ where: { projectId } });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to delete this animation.",
        });
      }

      await prisma.animation.delete({
        where: { animationId },
      });

      res.json({ message: "Animation deleted successfully." });
    } catch (error) {
      console.error("Error deleting animation:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- Handles Animation Routes ---------->

//create animation settings for a project -- WORKS
router.post(
  "/projects/:projectId/animation",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { frameRate, loop, exportFormat, isPublic, isDraft } = req.body;
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
        data: { projectId, frameRate, loop, exportFormat, isPublic, isDraft },
      });

      //update the project to set hasAnimation to true
      await prisma.project.update({
        where: { projectId },
        data: { hasAnimation: true },
      });

      res.status(201).json(animationSetting);
    } catch (error) {
      console.error("Error creating animation settings:", error.message);
      next(error);
    }
  }
);

//update animation settings for a project -- WORKS
router.patch(
  "/projects/:projectId/animation",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { frameRate, loop, exportFormat, isPublic, isDraft } = req.body;
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
        data: { frameRate, loop, exportFormat, isPublic, isDraft },
      });

      res.sendStatus(201).json({
        message: "Animation settings saved.",
        updatedAnimationSetting,
      });
    } catch (error) {
      console.error("Error updating animation settings:", error.message);
      next(error);
    }
  }
);

//get animation settings for a project -- WORKS
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

//get all animations for a project -- NEEDS TESTING
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

//create a new animation -- NEEDS TESTING
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

      const animation = await prisma.animation.create({
        data: {
          projectId,
          name,
          frames: JSON.stringify(frames),
          settings: {
            create: {
              frameRate,
              loop,
              exportFormat,
              isPublic: false,
              isDraft: true,
            },
          },
        },
        include: { settings: true },
      });

      res.status(201).json(animation);
    } catch (error) {
      console.error("Error creating animation:", error.message);
      next(error);
    }
  }
);

//update an animation for a project
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

//delete an animation
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

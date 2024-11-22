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
//<-------------------- ^^^^^^ -------------------->

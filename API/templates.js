const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

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

const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

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

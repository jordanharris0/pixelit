const router = require("express").Router();
module.exports = router;
const { isLoggedIn, mergePixels } = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- v Handles Project Routes v ---------->

//create new project for logged in user -- WORKS
router.post("/projects", isLoggedIn, async (req, res, next) => {
  const { title, description, tags, isPublic } = req.body;
  const userId = req.user.userId;

  try {
    const newProject = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        tags: tags || [],
        isPublic: isPublic || false, //defaults to false if not provided
      },
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error.message);
    next(error);
  }
});

//get all projects for logged in user -- WORKS
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

//update project details for logged in user -- WORKS
router.patch("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, tags, isPublic } = req.body;
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
        tags: tags || project.tags,
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

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this project." });
    }

    await prisma.project.delete({
      where: { projectId },
    });

    res.status(204).json({ message: "Project successfully deleted." }); //successfully deleted
  } catch (error) {
    console.error("Error deleting project:", error.message);
    next(error);
  }
});

//project draft managment -- WORKS
router.patch(
  "/projects/:projectId/draft/:frameNumber",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber } = req.params;
    const userId = req.user.userId;
    const { pixels } = req.body;

    try {
      //check if the project exists and belongs to the user
      const existingProject = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!existingProject || existingProject.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to save this project as a draft." });
      }

      //fetch the specific frame data
      const existingFrame = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      let updatedPixels;
      if (existingFrame) {
        //merge the existing pixels with the new ones
        updatedPixels = mergePixels(existingFrame.pixels, pixels);
        //update the existing frame with merged pixels
        await prisma.canvasData.update({
          where: {
            projectId_frameNumber: {
              projectId,
              frameNumber: parseInt(frameNumber),
            },
          },
          data: { pixels: updatedPixels },
        });
      } else {
        //create new frame data if it doesn't exist
        updatedPixels = JSON.stringify(pixels);
        await prisma.canvasData.create({
          data: {
            projectId,
            frameNumber: parseInt(frameNumber),
            pixels: updatedPixels,
            width: existingProject.width,
            height: existingProject.height,
          },
        });
      }

      res.json({
        message: "Frame updated successfully.",
        updatedFrame: { frameNumber, pixels: updatedPixels },
      });
    } catch (error) {
      console.error("Error updating frame pixels: ", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

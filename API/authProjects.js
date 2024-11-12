const router = require("express").Router();
module.exports = router;
const { isLoggedIn, mergePixels } = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- v Handles Project Routes v ---------->

//get all projects for logged in user -- WORKS
router.get("/projects", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        canvasData: true,
      },
    });

    res.json(projects);
  } catch (error) {
    console.error("Error retrieving projects:", error.message);
    next(error);
  }
});

//create new project/canvas data for logged in user -- WORKS
router.post("/projects", isLoggedIn, async (req, res, next) => {
  const { title, description, tags, isPublic, width, height, pixels } =
    req.body;
  const userId = req.user.userId;

  try {
    const newProject = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        tags: tags || [],
        isPublic: isPublic || false, //defaults to false if not provided
        canvasData: {
          create: {
            frameNumber: 1, //set as the initial frame
            width: width || 32, //default to 32 if not provided
            height: height || 32, //default to 32 if not provided
            pixels: pixels || [], //default to an empty array if not provided
          },
        },
      },
      include: { canvasData: true }, //include canvas data in the response
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error(
      "Error creating project with canvas settings:",
      error.message
    );
    next(error);
  }
});

//create a new frame in existing project -- WORKS
router.post(
  "/projects/:projectId/frames",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists and belongs to the user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized to add a frame to this project.",
        });
      }

      //find the highest existing frame number and increment it by one
      const maxFrame = await prisma.canvasData.findFirst({
        where: { projectId },
        orderBy: { frameNumber: "desc" },
      });

      const newFrameNumber = maxFrame ? maxFrame.frameNumber + 1 : 1; //start with 1 if no frames exist

      //use width and height from the last frame if available, or default if not
      const width = maxFrame?.width || 32;
      const height = maxFrame?.height || 32;

      //create the new frame data entry
      const newFrame = await prisma.canvasData.create({
        data: {
          projectId,
          frameNumber: newFrameNumber,
          pixels: JSON.stringify([]), //start with an empty array for pixels
          width, //inherit project's width and height
          height,
        },
      });

      res.status(201).json({
        message: "Frame added successfully.",
        newFrame,
      });
    } catch (error) {
      console.error("Error adding frame to project:", error.message);
      next(error);
    }
  }
);

//update project details for logged in user -- WORKS
router.patch("/projects/:projectId", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, tags, isPublic, width, height } = req.body;
  const userId = req.user.userId;

  try {
    //check if project exists and belongs to the user
    const project = await prisma.project.findUnique({ where: { projectId } });
    if (!project || project.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this project." });
    }

    //update project details (without width/height)
    const updatedProject = await prisma.project.update({
      where: { projectId },
      data: {
        title,
        description,
        tags: tags || project.tags,
        isPublic,
      },
    });

    //if width or height is provided, update all canvas frames with new dimensions
    if (width || height) {
      await prisma.canvasData.updateMany({
        where: { projectId },
        data: {
          width: width || project.width, //new width if provided, otherwise keep current
          height: height || project.height, //new height if provided, otherwise keep current
        },
      });
    }

    res.json({
      message: "Project and canvas dimensions updated successfully.",
      updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error.message);
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

//delete a project -- WORKS
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

//delete a frame from project -- WORKS
router.delete(
  "/projects/:projectId/frames/:frameNumber",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, frameNumber } = req.params;
    const userId = req.user.userId;

    try {
      //check if project exists and belongs to user
      const project = await prisma.project.findUnique({
        where: { projectId },
      });

      if (!project || project.userId != userId) {
        return res.status(403).json({
          message: "Unauthorized to delete this frame",
        });
      }

      //check if frame exists
      const frameToDelete = await prisma.canvasData.findUnique({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      if (!frameToDelete) {
        return res.status(404).json({
          message: "frame not found.",
        });
      }

      //delete specified frame
      const deletedFrame = await prisma.canvasData.delete({
        where: {
          projectId_frameNumber: {
            projectId,
            frameNumber: parseInt(frameNumber),
          },
        },
      });

      res.status(200).json({
        message: "Frame deleted successfully.",
        deletedFrame,
      });
    } catch (error) {
      console.error("Error delteing frame: ", error.message);
      next(error);
    }
  }
);

//<-------------------- ^^^^^^ -------------------->

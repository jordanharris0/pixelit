const router = require("express").Router();
module.exports = router;
const {
  isLoggedIn,
  createNotification,
} = require("../controllers/authController");

const prisma = require("../prisma");

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

//project draft managment
router.post("projects/draft", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;
  const { title, description, canvasData } = res.body;

  try {
    const draftProject = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        canvasData,
        isDraft: true,
      },
    });
    res.json({ message: "Project draft created successfully.", draftProject });
  } catch (error) {
    console.error("Error creating project draft: ", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

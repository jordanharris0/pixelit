const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

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

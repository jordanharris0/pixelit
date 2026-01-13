const router = require("express").Router();
module.exports = router;

const prisma = require("../prisma");
// const cache = require("../middleware/cache");
// const redisClient = require("../server");

//get all projects -- WORKS
router.get(
  "/",
  /*cache,*/ async (req, res) => {
    try {
      //get projects if not cached
      const projects = await prisma.project.findMany();

      //cache results for 30m
      // await redisClient.setEx("all_projects", 1800, JSON.stringify(projects));

      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects: ", error);
      res.status(500).json({ message: "Error retrieving projects" });
    }
  }
);

//get project by id -- WORKS
router.get(
  "/:id",
  /*cache,*/ async (req, res) => {
    const { id } = req.params;

    try {
      const project = await prisma.project.findUnique({
        where: { projectId: id },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      //cache porject data
      // await redisClient.setEx(id, 1800, JSON.stringify(project));

      res.json(project);
    } catch (error) {
      console.error("Error fetching project: ", error);
      res.status(500).json({ message: "Error retrieving project" });
    }
  }
);

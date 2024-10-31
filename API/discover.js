const router = require("express").Router();
module.exports = router;

const prisma = require("../prisma");

//search or filter projects
router.get("/projects/search", async (req, res, next) => {
  const { query, sort, tags } = req.query;

  try {
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          { isPublic: true },
          query ? { title: { contains: query, mode: "insensitive" } } : {},
          tags ? { tags: { hasSome: tags.split(",") } } : {}, //filter by tags
        ],
      },
      orderBy:
        sort === "popularity"
          ? { downloadCount: "desc" }
          : { createdAt: "desc" },
      select: {
        projectId: true,
        title: true,
        description: true,
        tags: true,
        createdAt: true,
        downloadCount: true,
        bookmarkCount: true,
      },
    });

    res.json(projects);
  } catch (error) {
    console.error("Error searching projects with tags:", error.message);
    next(error);
  }
});

//get trending projects
router.get("/projects/trending", async (req, res, next) => {
  try {
    const trendingProjects = await prisma.project.findMany({
      where: { isPublic: true },
      orderBy: [
        { downloadCount: "desc" },
        { bookmarkCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 10, //limit to top 10 trending projects
      select: {
        projectId: true,
        title: true,
        description: true,
        createdAt: true,
        downloadCount: true,
        bookmarkCount: true,
      },
    });

    res.json(trendingProjects);
  } catch (error) {
    console.error("Error retrieving trending projects:", error.message);
    next(error);
  }
});

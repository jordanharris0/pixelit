const router = require("express").Router();
module.exports = router;

const prisma = require("../prisma");

//search or filter projects
router.get("/projects/search", async (req, res, next) => {
  const { query, sort, tags, timeframe } = req.query;

  try {
    //define date filter based on timeframe
    const dateFilter = {
      weekly: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), //7 days ago
      monthly: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), //30 days ago
    };

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          { isPublic: true },
          query ? { title: { contains: query, mode: "insensitive" } } : {},
          tags ? { tags: { hasSome: tags.split(",") } } : {},
          timeframe ? { createdAt: { gte: dateFilter[timeframe] } } : {}, //time-based filter
        ],
      },
      orderBy:
        sort === "popularity"
          ? [{ downloadCount: "desc" }, { bookmarkCount: "desc" }]
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
    console.error(
      "Error searching projects with tags and filters:",
      error.message
    );
    next(error);
  }
});

//get trending projects
router.get("/projects/trending", async (req, res, next) => {
  const { timeframe } = req.query;

  try {
    //define date filter for trending projects
    const dateFilter = {
      weekly: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      monthly: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    const trendingProjects = await prisma.project.findMany({
      where: {
        AND: [
          { isPublic: true },
          timeframe ? { createdAt: { gte: dateFilter[timeframe] } } : {},
        ],
      },
      orderBy: [
        { downloadCount: "desc" },
        { bookmarkCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
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

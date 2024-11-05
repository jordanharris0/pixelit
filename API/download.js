const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- Handles Download Activity Routes ---------->

//download and track download activity for a project
router.post(
  "/projects/:projectId/download",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      const project = await prisma.project.findUnique({
        where: { projectId },
        select: {
          userId: true,
          isPublic: true,
          fileUrl: true, //file URL for the project
          downloadCount: true,
        },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      //authorization: check if the project is public or owned by the requesting user
      if (!project.isPublic && project.userId !== userId) {
        return res.status(403).json({
          message: "You are not authorized to download this project.",
        });
      }

      // Increment download count
      const updatedProject = await prisma.project.update({
        where: { projectId },
        data: { downloadCount: { increment: 1 } },
      });

      // Log download event in the Download table
      const download = await prisma.download.create({
        data: { userId, projectId },
      });

      res.status(200).json({
        message: "Download tracked successfully.",
        downloadCount: updatedProject.downloadCount,
        fileUrl: project.fileUrl, //add file URL to response for download initiation
        download,
      });
    } catch (error) {
      console.error("Error tracking download:", error.message);
      next(error);
    }
  }
);

//user download history
router.get("/users/:userId/downloads", isLoggedIn, async (req, res, next) => {
  const { userId } = req.params;

  try {
    const downloadHistory = await prisma.download.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            projectId: true,
            title: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { downloadedAt: "desc" },
    });

    res.json(downloadHistory);
  } catch (error) {
    console.error("Error fetching download history:", error.message);
    next(error);
  }
});

//<-------------------- ^^^^^^ -------------------->

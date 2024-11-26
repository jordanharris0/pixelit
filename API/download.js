const router = require("express").Router();
module.exports = router;
const {
  isLoggedIn,
  createNotification,
} = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- Handles Download Activity Routes ---------->

//download and track download activity for a project -- WORKS
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

      //increment download count (project)
      const updatedProject = await prisma.project.update({
        where: { projectId },
        data: { downloadCount: { increment: 1 } },
      });

      //increment download count for the project owner (user)
      await prisma.user.update({
        where: { userId: project.userId },
        data: { downloadCount: { increment: 1 } },
      });

      //log download event in the Download table
      const download = await prisma.download.create({
        data: { userId, projectId },
      });

      //create a notification for the project owner
      await createNotification(
        project.userId, //project owner's ID
        projectId,
        "DOWNLOAD",
        `Your project was downloaded!`
      );

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

//user download history --
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

//export an animation -- NEEDS TESTING
router.post(
  "/projects/:projectId/animations/:animationId/export",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId, animationId } = req.params;
    const { exportFormat } = req.body; // e.g., "GIF", "spriteSheet", "MP4"
    const userId = req.user.userId;

    try {
      //check if the project and animation exist
      const animation = await prisma.animation.findUnique({
        where: { animationId },
        include: { project: true },
      });

      if (!animation || animation.projectId !== projectId) {
        return res.status(404).json({ message: "Animation not found." });
      }

      //authorization: only public animations or user's own
      if (!animation.project.isPublic && animation.project.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to export this animation." });
      }

      //process export logic (e.g., generate sprite sheet or GIF)
      const exportedFile = await processExport(animation, exportFormat);

      //increment download count
      await prisma.project.update({
        where: { projectId },
        data: { downloadCount: { increment: 1 } },
      });

      await prisma.user.update({
        where: { userId: animation.project.userId },
        data: { downloadCount: { increment: 1 } },
      });

      //track the download
      await prisma.download.create({
        data: { userId, projectId },
      });

      res.status(200).json({
        message: `Animation exported successfully as ${exportFormat}.`,
        fileUrl: exportedFile.url,
      });
    } catch (error) {
      console.error("Error exporting animation:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

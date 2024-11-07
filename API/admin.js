const router = require("express").Router();
module.exports = router;
const { isLoggedIn, isAdmin } = require("../controllers/authController");

const prisma = require("../prisma");

//get all reports for review -- WORKS
router.get("/reports", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { username: true } },
        project: { select: { title: true, description: true } },
      },
    });

    res.json(reports);
  } catch (error) {
    console.error("Error retrieving reports:", error.message);
    next(error);
  }
});

//delete a reported project -- WORKS
router.delete(
  "/projects/:projectId",
  isLoggedIn,
  isAdmin,
  async (req, res, next) => {
    const { projectId } = req.params;

    try {
      const project = await prisma.project.findUnique({
        where: { projectId },
      });
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      await prisma.project.delete({
        where: { projectId },
      });

      res.status(200).json({ message: "Project deleted successfully." });
    } catch (error) {
      console.error("Error deleting project:", error.message);
      next(error);
    }
  }
);

//get all reported comments -- WORKS
router.get("/comments/reports", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const reportedComments = await prisma.report.findMany({
      include: {
        user: { select: { username: true } }, // User who reported
        comment: {
          // Details of the reported comment
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reportedComments);
  } catch (error) {
    console.error("Error retrieving reported comments:", error.message);
    next(error);
  }
});

//delete reported comment -- WORKS
router.delete(
  "/comments/:commentId",
  isLoggedIn,
  isAdmin,
  async (req, res, next) => {
    const { commentId } = req.params;

    try {
      const comment = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      // Delete the comment
      await prisma.comment.delete({
        where: { commentId },
      });

      res.status(200).json({ message: "Comment deleted successfully." });
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      next(error);
    }
  }
);

//Activity log for admin -- WORKS
router.get("/activity-log", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    const activityLog = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, //limit of results
    });
    res.json(activityLog);
  } catch (error) {
    console.error("Error retrieving activity log: ", error.message);
    next(error);
  }
});

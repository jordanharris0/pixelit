const router = require("express").Router();
module.exports = router;
const {
  isLoggedIn,
  createNotification,
} = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- Handles Bookmark Routes ---------->

//create bookmark on an project
router.post(
  "/projects/:projectId/bookmark",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the project exists
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      //check if the bookmark already exists
      const existingBookmark = await prisma.bookmark.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });

      if (existingBookmark) {
        //if bookmark exists, delete it (unbookmark)
        await prisma.bookmark.delete({
          where: { bookmarkId: existingBookmark.bookmarkId },
        });
        return res.status(200).json({ message: "Project unbookmarked." });
      } else {
        //if bookmark does not exist, create it
        const bookmark = await prisma.bookmark.create({
          data: { userId, projectId },
        });

        //create a notification for the project owner
        await createNotification(
          project.userId, //project owner's ID
          projectId,
          "BOOKMARK",
          `Your project was bookmarked!`
        );

        return res.status(201).json(bookmark);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error.message);
      next(error);
    }
  }
);

//get all bookmarks for logged in user
router.get("/user/bookmarks", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { project: true },
    });

    res.json(bookmarks.map((bookmark) => bookmark.project));
  } catch (error) {
    console.error("Error retrieving bookmarks:", error.message);
    next(error);
  }
});
//<-------------------- ^^^^^^ -------------------->

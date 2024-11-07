const router = require("express").Router();
module.exports = router;
const {
  isLoggedIn,
  createNotification,
} = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- v Handles Liking and Commenting Routes v ---------->

//liking a project
router.post("/projects/:projectId/like", isLoggedIn, async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.userId;

  try {
    //check if the project exists
    const project = await prisma.project.findUnique({ where: { projectId } });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    //check if the like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (existingLike) {
      //if like exists, delete it (unlike)
      await prisma.like.delete({
        where: {
          likeId: existingLike.likeId,
        },
      });
      return res.status(200).json({ message: "Project unliked." });
    } else {
      //if like does not exist, create it
      const like = await prisma.like.create({
        data: { userId, projectId },
      });

      //create a notification for the project owner
      await createNotification(
        project.userId, //project owner's ID
        projectId,
        "LIKE",
        `Your project received a new like!`
      );

      return res.status(201).json(like);
    }
  } catch (error) {
    console.error("Error toggling like on project:", error.message);
    next(error);
  }
});

//get likes on a project
router.get("/projects/:projectId/likes", async (req, res, next) => {
  const { projectId } = req.params;

  try {
    //check if the project exists
    const project = await prisma.project.findUnique({
      where: { projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    //fetch all likes on the project
    const likes = await prisma.like.findMany({
      where: { projectId },
      select: {
        userId: true,
        user: {
          select: {
            username: true,
            profilePicture: false, //optional field, if want to display profile pictures
          },
        },
      },
    });

    res.status(200).json({
      message: "Likes retrieved successfully.",
      likes,
    });
  } catch (error) {
    console.error("Error retrieving likes on project:", error.message);
    next(error);
  }
});

//creating a comment on a project
router.post(
  "/projects/:projectId/comment",
  isLoggedIn,
  async (req, res, next) => {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    try {
      //check if the project exists
      const project = await prisma.project.findUnique({ where: { projectId } });
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      //create the comment
      const comment = await prisma.comment.create({
        data: {
          userId,
          projectId,
          content,
        },
      });

      //create a notification for the project owner
      await createNotification(
        project.userId, //project owner's ID
        projectId,
        "COMMENT",
        `Your project received a new comment!`
      );

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error.message);
      next(error);
    }
  }
);

//getting comments on a project
router.get("/projects/:projectId/comments", async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    console.error("Error retrieving comments:", error.message);
    next(error);
  }
});

//update comment on a project
router.patch(
  "/projects/:projectId/comments/:commentId",
  isLoggedIn,
  async (req, res, next) => {
    const { commentId } = req.params;
    const { content } = req.body; //the updated content for the comment
    const userId = req.user.userId;

    try {
      //check if the comment exists and belongs to the user
      const comment = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to edit this comment." });
      }

      //update the comment content
      const updatedComment = await prisma.comment.update({
        where: { commentId },
        data: { content },
      });

      res.json(updatedComment);
    } catch (error) {
      console.error("Error editing comment:", error.message);
      next(error);
    }
  }
);

//deleting a comment the user made
router.delete(
  "/projects/:projectId/comments/:commentId",
  isLoggedIn,
  async (req, res, next) => {
    const { commentId } = req.params;
    const userId = req.user.userId;

    try {
      //check if the comment exists and belongs to the user
      const comment = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found." });
      }

      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this comment." });
      }

      //delete the comment
      await prisma.comment.delete({
        where: { commentId },
      });

      res.status(204).send(); //successfully deleted with no content
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

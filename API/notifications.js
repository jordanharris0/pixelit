const router = require("express").Router();
module.exports = router;
const { isLoggedIn } = require("../controllers/authController");

const prisma = require("../prisma");

//<---------- Handles Notification Routes ---------->

//get all notifications
router.get("/notifications", isLoggedIn, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        notificationId: true,
        type: true,
        message: true,
        isRead: true,
        createdAt: true,
        project: {
          select: {
            projectId: true,
            title: true,
          },
        },
      },
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    next(error);
  }
});

//mark a notification as read
router.patch(
  "/notifications/:notificationId",
  isLoggedIn,
  async (req, res, next) => {
    const { notificationId } = req.params;

    try {
      const notification = await prisma.notification.update({
        where: { notificationId },
        data: { isRead: true },
      });

      res
        .status(200)
        .json({ message: "Notification marked as read.", notification });
    } catch (error) {
      console.error("Error marking notification as read:", error.message);
      next(error);
    }
  }
);
//<-------------------- ^^^^^^ -------------------->

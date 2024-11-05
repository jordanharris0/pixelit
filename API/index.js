const router = require("express").Router();
module.exports = router;

router.use("/auth", require("./authAccount"));
router.use("/authProjects", require("./authProjects"));
router.use("/admin", require("./admin"));
router.use("/projects", require("./projects"));
router.use("/users", require("./users"));
router.use("/discover", require("./discover"));
router.use("/canvas", require("./canvas"));
router.use("/likeComment", require("./likeComment"));
router.use("/bookmarks", require("./bookmarks"));
router.use("/collaboration", require("./collaboration"));
router.use("/animation", require("./animation"));
router.use("/templates", require("./templates"));
router.use("/download", require("./download"));
router.use("/notifciations", require("./notifications"));

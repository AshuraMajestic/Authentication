import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toPublicUser, User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

router.use(authenticate);

/** Any authenticated role. */
router.get(
  "/account",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.userId);
    if (!user) throw ApiError.unauthorized();
    res.json({ user: toPublicUser(user) });
  })
);


router.get("/manager/overview", authorize("admin", "manager"), (_req, res) => {
  res.json({
    message: "Manager workspace placeholder — wire up real data here.",
  });
});

export default router;

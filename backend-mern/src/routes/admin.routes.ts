import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { updateRoleSchema } from "../validators/auth.validators";
import * as adminController from "../controllers/admin.controller";

const router = Router();


router.use(authenticate, authorize("admin"));

router.get("/users", asyncHandler(adminController.listUsers));
router.patch(
  "/users/:id/role",
  validateBody(updateRoleSchema),
  asyncHandler(adminController.updateUserRole)
);

export default router;

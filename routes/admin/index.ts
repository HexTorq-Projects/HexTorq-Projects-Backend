import { Router } from "express";
import auth from "./auth";
import users from "./users";
import projects from "./projects";
import categories from "./categories";
import subCategories from "./subCategories";
import applicationAreas from "./applicationAreas";
import orders from "./orders";
import enquiries from "./enquiries";
import wishlist from "./wishlist";
import offers from "./offers";
import stats from "./stats";
import referrals from "./referrals";

const router = Router();

router.use("/", auth);
router.use("/users", users);
router.use("/projects", projects);
router.use("/categories", categories);
router.use("/sub-categories", subCategories);
router.use("/application-areas", applicationAreas);
router.use("/orders", orders);
router.use("/enquiries", enquiries);
router.use("/wishlist", wishlist);
router.use("/offers", offers);
router.use("/stats", stats);
router.use("/referrals", referrals);

export default router;

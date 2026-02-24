import { Router } from "express";

import{
    createSettlement,
    getGroupSettlements,
    completSettlement,
    getUserSettlements
}from "../controller/settlement.controller.js"
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(protect);


router.post("/",createSettlement);
router.get("/",getUserSettlements);
router.get("/group/:groupId",getGroupSettlements)
router.patch("/:settlementId/complete",completSettlement);

export default router;
import { Router } from "express"            
import{
    getGroupBalances,
    getMyBalances
} from "../controller/balance.controller.js"
import { protect } from "../middlewares/auth.middleware.js";        

const router = Router();

router.use(protect)

router.get("/group/:groupId",getGroupBalances)
router.get("/me",getMyBalances)


export default router;
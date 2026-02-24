import { Router } from "express";
import {
    createGroup,
    getMyGroups,
    getGroupById,
    addMember,
    removeMember,
    leaveGroup
} from "../controller/group.controller.js"

import {protect} from "../middlewares/auth.middleware.js"


const router = Router()


router.use(protect)

router.post("/",createGroup)
router.get("/",getMyGroups)
router.get("/:groupId",getGroupById)
router.post("/:groupId/members",addMember)
router.delete("/:groupId/members/:userId",removeMember) //admin kregea 
router.delete("/:groupId/leave",leaveGroup)



export default router;


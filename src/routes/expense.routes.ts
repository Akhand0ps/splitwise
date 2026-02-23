import { Router } from "express";
import{
    addExpense,
    getGroupExpenses,
    getExpenseById,
    deleteExpense
} from "../controller/expense.controller.js"

import { protect } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(protect)

router.post("/",addExpense)
router.post("/group/:groupId",getGroupExpenses)
router.post("/:expenseId",getExpenseById)
router.post("/:expenseID",deleteExpense)




export default router;
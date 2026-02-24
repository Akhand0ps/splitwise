import express from "express"
import authRoutes from "./routes/auth.routes.js"
import groupRoutes from "./routes/group.routes.js"
import expenseRoutes from "./routes/expense.routes.js"
import settlementRoutes from "./routes/settlement.routes.js"
import balanceRoutes from "./routes/balance.routes.js"
import cors from "cors"

const app = express();


const corsOptions = {
    origin:'*',
    methods:['GET','POST','PUT','PATCH','DELETE'],
    allowedHeaders:['Content-Type',"Authorization"]

}

app.use(cors(corsOptions))
app.use(express.json())


app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/groups",groupRoutes)
app.use("/api/v1/expenses",expenseRoutes)
app.use("/api/v1/settlements",settlementRoutes)
app.use("/api/v1/balances",balanceRoutes)


app.get("/",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"ALL is well"
    })
})





export default app;
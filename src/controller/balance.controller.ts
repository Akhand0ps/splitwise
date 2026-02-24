import { Request,Response } from "express"
import { prisma } from "../lib/prisma.js"
import { calculateBalances, simplifyDebts } from "../utils/balance.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

// export const balances = async(req:Request,res:Response)=>{

//     const groupid = Number(req.params.groupid); 

//     try{
//         const expenses = await prisma.expense.findMany({
//             where:{groupid},
//             include:{splis:true}
//         });

//         const settlements = await prisma.settlement.findMany({
//             where: {groupid}
//         })


//         const balancess = calculateBalances(expenses,settlements);
//         const transactions = simplifyDebts(balances);

//         res.status(200).json({
//             succes:true,
//             balances,transactions
//         })

//     }catch(err){

//         res.status(500).json({
//             success:false,
//             message:err
//         })
//         return;
//     }
// }

export const getGroupBalances = async(req:AuthRequest,res:Response)=>{
    try{



        const groupId = Number(req.params.groupId)
        if(!groupId){
            res.status(400).json({
                success:false,
                message:'GroupId is required'
            })
            return;
        }

        const membership = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId:req.userId!,
                    groupId
                }
            }
        })

        if(!membership){
            res.status(403).json({
                success:false,
                message:'You are not the member of this group'
            })
            return;
        }

        const[expenses,settlements,members] = await Promise.all([
            prisma.expense.findMany({
                where:{groupId},
                include:{splits:true}
            }),
            prisma.settlement.findMany({
                where:{groupId}
            }),
            prisma.groupMember.findMany({
                where:{groupId},
                include:{
                    user:{
                        select:{
                            id:true,
                            name:true,
                            email:true
                        }
                    }
                }
            })
        ])

        const balances = calculateBalances(expenses,settlements)
        const transactions = simplifyDebts(balances)

        
        const enrichedBalances = Object.entries(balances).map(([userId,amount])=>{
            const member = members.find(m=> m.userId === Number(userId))
            return{
                user:member?.user,
                //@ts-ignore
                amount:parseFloat(amount.toFixed(2)),
                //@ts-ignore
                status:amount >0 ? "owed" : amount<0 ? "owes" : "settled"
            }
        })

        const enrichedTransactions = transactions.map(t=>{
            const from = members.find(m=>m.userId === Number(t.from))
            const to = members.find(m=>m.userId === Number(t.to))

            return {
                from:from?.user,
                to:to?.user,
                amount: t.amount
            }
        })

        res.status(200).json({
            success:true,
            balances:enrichedBalances,
            transactions:enrichedTransactions
        })
        return;
    }catch(err:any){

        console.error(err.message)
        res.status(500).json({

            success:false,
            error:'INTERNAL SERVER ERROR'
        })
        return;
    }
}

export const getMyBalances = async(req:AuthRequest,res:Response)=>{

    try{


        const userId = req.userId;
        
        const myGroups = await prisma.groupMember.findMany({
            where:{userId},
            include:{group:{
                select:{
                    id:true,
                    name:true
                }
            }}
        })

        const result = await Promise.all(
            myGroups.map(async({group})=>{
                const [expenses,settlements] = await Promise.all([
                    prisma.expense.findMany({
                        where:{groupId: group.id},
                        include:{
                            splits:true
                        }
                    }),
                    prisma.settlement.findMany({
                        where:{groupId: group.id}
                    })
                ])

                const balances = calculateBalances(expenses,settlements)
                //@ts-ignore
                const myBalance = balances[userId] || 0

                return {
                    group,
                    balance: parseFloat(myBalance.toFixed(2)),
                    status: myBalance > 0 ? "owed":myBalance < 0 ? "owes" : "settled"
                }
            })
        )

        const totalbalance = result.reduce((sum,g)=>sum+g.balance,0);

        res.status(200).json({
            success:true,
            overall:parseFloat(totalbalance.toFixed(2)),
            groups:result
        })
        return

    }catch(err:any){
        console.error(err.message)
        res.status(500).json({
            success:false,
            message:err.message
        })
        return;
    }
}
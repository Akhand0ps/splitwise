import { Request,Response } from "express"
import { prisma } from "../lib/prisma.js"
import { calculateBalances, simplifyDebts } from "../utils/balance.js";

export const balances = async(req:Request,res:Response)=>{

    const groupid = req.params.groupid; 

    try{


        const expenses = await prisma.expense.findMany({
            where:{groupid},
            include:{splis:true}
        });

        const settlements = await prisma.settlement.findMany({
            where: {groupid}
        })


        const balancess = calculateBalances(expenses,settlements);
        const transactions = simplifyDebts(balances);

        res.status(200).json({
            succes:true,
            balances,transactions
        })

    }catch(err){

        res.status(500).json({
            success:false,
            message:err
        })
        return;
    }
}
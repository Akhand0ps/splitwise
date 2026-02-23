import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import {prisma} from "../lib/prisma.js"
import { PrismaClient } from "@prisma/client/extension.js";


const buildSplits = (
  splitType: string,
  amount: number,
  memberIds: number[],
  customSplits?: { userId: number; value: number }[]
   //@ts-ignore
): { userId: number; amount: PrismaClient.Decimal; percentage?: PrismaClient.Decimal }[] =>{
    
    if(splitType === 'EQUAL'){
       
        const share:number = parseFloat((amount/memberIds.length).toFixed(2))
        const total:number = share * memberIds.length
        const remainder = parseFloat((amount-total).toFixed(2))

        return memberIds.map((userId,index)=>({
             userId,
            amount: new PrismaClient.Decimal(index ===0 ? share+remainder: share)
        }))
    }

    if(splitType === 'EXACT'){
        //@ts-ignore
        const spiltTotal:number = customSplits?.reduce((sum,s)=>sum+s.value,0)

        if(Math.abs(spiltTotal-amount) > 0.01){
            throw new Error('Amount must add up to original split amount')
        }
        return customSplits!.map(s=>({
            userId:s.userId,
            amount: new PrismaClient.Decimal(s.value)
        }))

    }
}
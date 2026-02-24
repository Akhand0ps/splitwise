import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import {prisma} from "../lib/prisma.js"
import { PrismaClient } from "@prisma/client/extension.js";
import { Prisma } from "../generated/prisma/client.js";

const buildSplits = (
  splitType: string,
  amount: number,
  memberIds: number[],
  customSplits?: { userId: number; value: number }[]
   //@ts-ignore
): { userId: number; amount: Prisma.Decimal; percentage?: Prisma.Decimal }[] =>{
    
    if(splitType === 'EQUAL'){
       
        const share:number = parseFloat((amount/memberIds.length).toFixed(2))
        const total:number = share * memberIds.length
        const remainder = parseFloat((amount-total).toFixed(2))

        return memberIds.map((userId,index)=>({
             userId,
            amount: new Prisma.Decimal(index ===0 ? share+remainder: share)
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
            amount: new Prisma.Decimal(s.value)
        }))

    }
    if(splitType === "PERCENTAGE"){
        //@ts-ignore
        const percentageTotal:number = customSplits?.reduce((sum,s)=> sum + s.value,0);
        if(Math.abs(percentageTotal - amount) > 0.01){
            throw new Error('Amount must add up to original split amount')
        }
        //@ts-ignore
        return customSplits?.map(s=>({
            userId: s.userId,
            amount: new Prisma.Decimal(((s.value)*amount).toFixed(2)),
            percentage: new Prisma.Decimal(s.value)
        }))
    }

    throw new Error('Invalid split Type')
}

export const addExpense = async(req:AuthRequest,res:Response)=>{
    try{

        const {description,amount,groupId,splitType ="EQUAL",customSplits} = req.body;
        if(!amount || !groupId){
            res.status(400).json({
                success:false,
                message:'amount and groupId are required'
            })
            return;
        }

        if(amount <= 0){
            res.status(400).json({
                success:false,
                message:'Amount must be greater than 0'
            })
            return;
        }

        const memberShip = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId: req.userId!,
                    groupId
                }
            }
        })

        if(!memberShip){
            res.status(403).json({
                success:false,
                message:'Only group member is allowed'
            })
            return;
        }

        //ab sare group memmbers nikal

        const groupmembers = await prisma.groupMember.findMany({
            where:{
                groupId
            }
        })
        //@ts-ignore
        
        const memberIds = groupmembers.map((m)=>{
            return m.userId
        })

        if(splitType !== "EQUAL" && customSplits){
            const splitUserIDs:number[] = customSplits.map((s:{
                userId:number,
                value:number
            })=>{
                s.userId
            })

            const allMembers = splitUserIDs.every((id:number)=>memberIds.includes(id))
            if(!allMembers){
                res.status(400).json({
                    success:false,
                    message:'split contains non-members. mtlb ye group ke member nhi hai.check kr wapise'
                })
                return;
            }
        }

        let splits;

        try{
            splits = buildSplits(splitType,Number(amount),memberIds,customSplits)
        }catch(err:any){
            console.log(err.message)
            res.status(400).json({
                success:false,
                message: err.message
            })
            return;
        }
        const expense = await prisma.expense.create({
            data:{
                description,
                amount: new Prisma.Decimal(amount),
                groupId: groupId,
                paidById: req.userId!,
                splitType,
                splits:{
                    create:splits
                }
            },
            include:{
                paidBy:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                splits:{
                   include:{
                        user:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                   }
                }
            }
        })

        res.status(201).json({
            success:true,
            expense
        })
        return;
    }catch(err){
        console.error(err)
        res.status(500).json({
            success:false,
            message:'INTERNAL SERVER ERROR'
        })
        return;
    }
}
export const getGroupExpenses = async(req:AuthRequest,res:Response)=>{

    try{

        const groupId = Number(req.params.groupId);
        const {page =1 ,limit = 20} = req.query;

        const memberShip = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId: req.userId!,
                    groupId
                }
            }
        })

        if(!memberShip){
            res.status(403).json({
                success:false,
                message:'You are not a member of this group'
            })
            return;
        }
        const expenses = await prisma.expense.findMany({
            where:{groupId},
            orderBy:{createdAt:"desc"},
            skip:(Number(page)-1) * Number(limit),
            take: Number(limit),
            include:{
                paidBy:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                splits:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                    }
                }
            }
        })

        const total = await prisma.expense.count({
            where:{groupId}
        })
        
        res.status(200).json({
            expenses,
            pagination:{
                page:Number(page),
                limit:Number(limit),
                total,
                pages:Math.ceil(total/Number(limit))
            }
        })
        return;
    }catch(err){
        console.error(err)
        res.status(500).json({
            success:false,
            message:'INTERNAL SERVER ERROR'
        })
        return;
    }
}
export const getExpenseById = async(req:AuthRequest,res:Response)=>{

    try{
        

        const expenseId = Number(req.params.expenseId)

        const expense = await prisma.expense.findUnique({
            where:{
                id:expenseId
            },
            include:{
                paidBy:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                splits:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                    }
                },
                group:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            }
        })

        if(!expense){
            res.status(404).json({
                success:false,
                message:'Expense not found'
            })
            return;
        }

        const memberShip = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId: req.userId!,
                    groupId: expense.groupId
                }
            }
        })

        if(!memberShip){
            res.status(403).json({
                success:false,
                message:'you are not a member of this group. GET OUT or ask admin to add you'
            })
            return;
        }

        res.status(200).json({
            success:true,
            expense
        })
        return

    }catch(err){
        console.error(err)
        res.status(500).json({
            success:false,
            message:'INTERNAL SERVER ERROR'
        })
        return;
    }
}
export const deleteExpense = async(req:AuthRequest,res:Response)=>{

    try{

        const expenseId = Number(req.params.expenseId)
        const expense = await prisma.expense.findUnique({
            where:{
                id:expenseId
            }
        })

        if(!expense){
            res.status(404).json({
                success:false,
                message:'Expense not found'
            })
            return;
        }
        const memberShip = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId:req.userId!,
                    groupId:expense.groupId
                }
            }
        })
        if(!memberShip){
            res.status(403).json({
                success:false,
                message:'You are not a meber of this group'
            })
            return;
        }

        const isAdmin = memberShip.role === "ADMIN"
        const isPayer = expense.paidById === req.userId

        if(!isAdmin && !isPayer){
            res.status(403).json({
                success:false,
                message:'Only the payer and the admin can delete the expense'
            })
            return;
        }

        //pehle splits delete kr, then expense
        await prisma.expenseSplit.deleteMany({where:{expenseId}})
        await prisma.expense.delete({where:{id:expenseId}})

        res.status(200).json({
            success:true,
            message:'Expense deleted'
        })
        return;

    }catch(err:any){
        console.error(err.message)
        res.status(500).json({
            success:false,
            message:err.message
        })
        return;
    }
}
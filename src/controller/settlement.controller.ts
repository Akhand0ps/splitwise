import { Response } from "express";
import {prisma} from "../lib/prisma.js"
import { AuthRequest } from "../middlewares/auth.middleware.js";


export const createSettlement = async(req:AuthRequest,res:Response)=>{
    
    try{

        const {toUser,groupId,amount,note} = req.body;
        if(!toUser || !amount){
            res.status(400).json({
                message:'toUserId and amount is required'
            })
            return;
        }

        if(amount <= 0){
            res.status(400).json({
                message:"Amount cannot be zero"
            })
            return;
        }

        if(toUser === req.userId!){
            res.status(403).json({
                message:'You cannot settle with yourself'
            })
            return;
        }

        if(groupId){

            const fromMemberShip = await prisma.groupMember.findUnique({
                where:{
                    userId_groupId:{
                        userId: req.userId!,
                        groupId
                    }
                }
            })

            const toMemberShip = await prisma.groupMember.findUnique({
                where:{
                    userId_groupId:{
                        userId:toUser,
                        groupId
                    }
                }
            })

            if(!fromMemberShip || !toMemberShip){
                res.status(403).json({
                    message:'Both members must be in the same group'
                })
                return;
            }
        }


        //yaha settle kr
        const settlement = await prisma.settlement.create({
            //@ts-ignore
            data:{
                fromUserId:req.userId!,
                toUser,
                groupId: groupId || null,
                amount: parseFloat(Number(amount).toFixed(2)),
                note: note || null,
                status: "PENDING"
            },
            include:{
                fromUser:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                toUser:{
                    select:{
                        id:true,
                        name:true
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

        res.status(201).json({
            success:true,
            settlement
        })
        return;
    }catch(err:any){
        console.error(err.message)
        res.status(500).json({
            success:false,
            error:err.message
        })
        return;
    }
}
export const getGroupSettlements = async(req:AuthRequest,res:Response)=>{
    
    try{

        const groupId = Number(req.params.groupId);
        const memberShip = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId:req.userId!,
                    groupId
                }
            }
        })

        if(!memberShip){
            res.status(403).json({
                success:false,
                message:'You are not the member of the '
            })
            return;
        }

        const settlements = await prisma.settlement.findMany({

            where:{groupId},
            orderBy:{createdAt:"desc"},
            include:{
                fromUser:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                toUser:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            }
        })
        res.status(200).json({
            success:true,
            settlements
        })
        return;
    }catch(err:any){
        console.error(err.message);
        res.status(500).json({
            success:false,
            error:err.message
        })
        return;
    }
}

export const completSettlement = async(req:AuthRequest,res:Response)=>{
    
    try{


        const settlementId = Number(req.params.settlementId);

        if(!settlementId){
            res.status(400).json({
                success:false,
                message:'settlement Id is required for settlement'
            })
            return;
        }

        const settlement = await prisma.settlement.findUnique({
            where:{
                id: settlementId
            }
        })
        if(!settlement){
            res.status(404).json({
                success:false,
                message:'Settlement not found'
            })
            return;
        }
        if(settlement.toUserId !== req.userId!){
            res.status(403).json({
                success:false,
                message:'only the receiver can confirm the settlement.'
            })
            return;
        }

        if(settlement.status === 'COMPLETED'){
            res.status(400).json({
                message:'settlement is already completed'
            })
            return;
        }

        const updated = await prisma.settlement.findUnique({
            where:{id:settlementId},
            //@ts-ignore
            data:{status:"COMPLETED"},
            include:{
                fromUser:{select:{id:true,name:true}},
                toUser:{select:{id:true,name:true}},
                group:{select:{id:true,name:true}}
            }
        })

        res.status(200).json({
            success:true,
            settlement:updated
        })
        return;
    }catch(err:any){
        console.error(err.message);
        res.status(500).json({
            success:false,
            error:err.message
        })
        return;
    }
}
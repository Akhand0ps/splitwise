import { Response } from "express";
import {prisma} from "../lib/prisma.js"
import { AuthRequest } from "../middlewares/auth.middleware.js";


export const createGroup = async(req:AuthRequest,res:Response) =>{

    try{
        //@ts-ignore
        const {name,description} = req.body;

        if(!name){
            res.status(400).json({
                success:false,
                message:'Group name is required'
            })
            return;
        }

        const group = await prisma.group.create({
            data:{
                name,
                description:description || null,
                members:{
                    create:{
                        userId: req.userId!,
                        role:"ADMIN"
                    }
                }
            },
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true,
                                email:true,
                            }
                        }
                    }
                }
            }
        })

        res.status(201).json({
            success:true,
            group
        })
        return;


    }catch(error){
        console.error(error)
            res.status(500).json({ message: "Internal server error" })
    }
}

export const getMyGroups = async(req:AuthRequest,res:Response)=>{

    try{

        const groups = await prisma.group.findMany({
            where:{
                members:{
                    some:{
                        userId:req.userId
                    }
                }
            },
            include:{
                members:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true,
                                email:true
                            }
                        }
                    }
                }
            }
        })
        res.status(200).json({
            success:true,
            groups
        })
        return;
    }catch(error){
        console.error(error)
            res.status(500).json({ message: "Internal server error" })
    }
}

export const getGroupById = async(req:AuthRequest,res:Response)=>{
    try{

        const groupId = Number(req.params.groupId)

        //membership check krle
        const membership = await prisma.groupMember.findUnique({
            where:{
                userId_groupId: {userId:req.userId!,groupId}
            }
        })
        if(!membership){
            res.status(403).json({
                message:"You are not a member of this group"
            })
            return;
        }

        const group = await prisma.group.findUnique({
            where: {id:groupId},
            include:{
                members:{
                    user:{
                        select:{
                            id:true,
                            name:true,
                            email:true
                        }
                    }
                },
                expenses:{
                    orderBy:{createdAt: "desc"},
                    take:10,
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
                }
            }
        })

        res.status(200).json({
            success:true,
            group
        })
        return;

    }catch(error){
        console.error(error)
            res.status(500).json({ message: "Internal server error" })
    }
}

export const addMember = async(req:AuthRequest,res:Response)=>{

    try{

        const groupId = Number(req.params.groupId)
        const{email} = req.body;

        if(!email){
            res.status(400).json({
                success:false,
                message:'email is req'
            })
            return;
        }
        //only admin can do this bro
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: req.userId!,
                    groupId
                }
            }
        })


        if(!membership || membership.role !== "AMDIN"){
            res.status(403).json({
                success:false,
                message:"Only admins can add members"
            })
            return
        }

        const userToadd = await prisma.user.findUnique({
            where:{
                email:email.toLowerCase().trim()
            }
        })
        if(!userToadd){
            res.status(404).json({ 
                success:false,
                message: "User with this email not found"
             })
            return
        }

        //check kahi pehele hi member toh nhi

        const alreadyMember = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId: userToadd.id,groupId
                }
            }
        })

        if (alreadyMember) {
            res.status(409).json({ message: "User is already a member" })
            return
        }

        const newMember = await prisma.groupMember.create({
            data:{
                userId: userToadd.id,
                groupId,
                role:"MEMBER"
            },
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

        res.status(201).json({
            success:true,
            member:newMember
        })


    }catch(error){
        console.error(error)
            res.status(500).json({ message: "Internal server error" })
    }
}

export const removeMember = async(req:AuthRequest,res:Response)=>{
    try{

        const groupId = Number(req.params.groupId)
        const targetUser = Number(req.params.userId)

        //sirf admin hi rmeove krega
        const membership = await prisma.groupMember.findUnique({
            where:{
                userId_groupId: {
                    userId:req.userId!,
                    groupId
                }
            }
        })

        if(!membership || membership.role !== "ADMIN"){
            res.status(403).json({
                success:false,
                message:"Only admin can remove"
            })
            return;
        }

        if(targetUser === req.userId){
            res.status(400).json({
                message:"You are admin, please use leave group instead"
            })
            return;
        }

        await prisma.groupMember.delete({
            where:{
                userId_groupId:{
                    userId:targetUser,
                    groupId
                }
            }
        })
        res.status(200).json({
            success:true,
            message:"Member removed"
        })
        return


    }catch(error){
        console.error(error)
            res.status(500).json({ message: "Internal server error" })
    }
}

export const leaveGroup = async(req:AuthRequest,res:Response)=>{

    try{

        const groupId = Number(req.params.groupId)

        const membership = await prisma.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId:req.userId!,
                    groupId
                }
            }
        })

        if(!membership){
            res.status(404).json({ message: "You are not a member of this group" })
            return
        }

        if(membership.role === "ADMIN"){

            const otherAdmins = await prisma.groupMember.count({
                where:{
                    groupId,
                    role:"ADMIN",
                    userId:{not:req.userId}
                }
            })

            if(otherAdmins === 0){
                res.status(400).json({
                    message:"Please Assign another admin before leaving this group please"
                })
                return;
            }
        }

        await prisma.groupMember.delete({
            where:{
                userId_groupId:{
                    userId: req.userId!,
                    groupId
                }
            }
        })

        res.status(200).json({
            success:true,
            message:"Left group successfully"
        })

    }catch(error){
        console.error(error)
            res.status(500).json({ message: "Internal server error" })
    }
}
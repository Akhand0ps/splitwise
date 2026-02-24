import { Request,Response } from "express";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import {prisma} from "../lib/prisma.js"
import { AuthRequest } from "../middlewares/auth.middleware.js";


const generateToken = (userId:number)=>{
    return jwt.sign(

        {userId},
        process.env.JWT_SECRET!,
        {expiresIn: "7d"}
    )
}


export const register = async(req:Request,res:Response)=>{

    try{

        const {name,email,password,phone} = req.body

        if(!name || !email || !password){
            res.status(400).json({
                success:false,
                message:"Name,email and password are requried"
            })
            return;
        }

        const l_email = email.toLowerCase().trim()
        const existingUser = await prisma.user.findUnique({
            where: {email:l_email}
        })

        if(existingUser){
            res.status(409).json({ message: "Email already in use" })
            return
        }

        const hashedPassword = await bcrypt.hash(password,10)


        const user = await prisma.user.create({
            data:{
                name,
                email:l_email,
                password:hashedPassword,
                phone: phone || null
            },
            select:{
                id:true,
                name:true,
                email:true,
                phone:true,
                createdAt:true
            }
        })

        const token = generateToken(user.id);

        res.status(201).json({
            success:true,
            user,
            token
        })
        return;

    }catch(err){
        console.error(err);
        res.status(500).json({message:'Internal server error'})
    }
}
export const login = async(req:Request,res:Response)=>{

    try{

        const {email,password} = req.body;

        if(!email || !password){

            res.status(400).json({success:false, message: "Email and password are required" })
            return
        }

        const l_email = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: l_email }
        })

        if (!user) {
            res.status(401).json({ success:false, message: "Invalid credentials" })
            return
        }
        
        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            res.status(401).json({
                success:false,
                message:'Invalid credentials'
            })
            return;
        }

        const token = generateToken(user.id);
        res.status(200).json({
            success:true,
            message:"logged in",
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                createdAt: user.createdAt
            },
            token
        })
        return;
    }catch(err){
        console.error(err)
        res.status(500).json({
            success:false,
            message:"Internal Server error"
        })
    }
}

export const getMe = async(req:AuthRequest,res:Response)=>{
    try{

        const user = await prisma.user.findUnique({
            //@ts-ignore
            where:{id:req.userId},
            select:{
                id:true,
                name:true,
                email:true,
                phone:true,
                createdAt:true
            }
        })

        
        if (!user) {
            res.status(404).json({ success:true, message: "User not found" })
            return
        }
        res.status(200).json({
            success:true,
            user
        })
        return;

    }catch(err){
        console.error(err)
        res.status(500).json({success:false, message: "Internal server error" })
        return;
    }
}
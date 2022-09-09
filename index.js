import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";
import dayjs from "dayjs";

dotenv.config();

const server=express();
server.use(cors());
server.use(express.json());

const mongoClient= new MongoClient(process.env.MONGO_URI);  

let db;

mongoClient.connect().then(()=>{db=mongoClient.db("batepapouol")});

const usersSchema = joi.object({
    name: joi.string().required(),
})
const messageSchema= joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message","private_message").required(),
    time: joi.string()
})
server.post("/participants", async (req,res)=>{
    const user=req.body;
    const validation= usersSchema.validate(user);
    if(validation.error){
        return res.status(422).send("name deve ser strings não vazio"); 
    }
    try{
        const userExists = await db.collection("users").findOne({name: user.name});
        if(userExists){
            return res.status(409).send("Nome já utilizado");
        }   
        await db.collection("users").insertOne({name: user.name , lastStatus: Date.now()})
        await db.collection("message").insertOne({
            from: user.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format("HH:MM:SS")
        });
        res.sendStatus(201);
    }catch(err){
        res.status(500).send(err.message);
    }
    res.send("liberado");
});

server.get("/participants", async (req,res)=>{
const list= await db.collection("users").find({}).toArray();
res.send(list);
})



server.listen(5000, ()=>{console.log("escutando 5000")})

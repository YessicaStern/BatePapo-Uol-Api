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
        await db.collection("users").insertOne({
            name: user.name ,
            lastStatus: Date.now()})

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
});

server.post("/messages", async (req,res)=>{
    const {to,text,type}=req.body;
    const {user}= req.headers;
    try{
        const message={
            from: user,
            to,
            text,
            type,
            time: dayjs().format("HH:MM:SS")
        }
        const validation = messageSchema.validate(message);
        if(validation.error){
            return res.sendStatus(422);
        }
        const userExists= await db.collection("users").findOne({name: user});
        if(!userExists){
            return res.sendStatus(409);
        }
        await db.collection("messages").insertOne(message);
        res.sendStatus(201);
    }catch(err){
        res.status(500).send(err.message);
    }
})

server.get("/messages", async (req,res)=>{
    const {user}=req.headers;
    const limit = Number(req.query.limit); // console.log(limit);
    try{
        const allMessages= await db.collection("messages").find({}).toArray();
        const messagesUser= allMessages.filter(value=> {
            const messagesPublic= value.type==="message";
            const messagesToUser= value.from === user || value.to==="Todos"|| value.to===user;
            return messagesPublic || messagesToUser;
        })

        res.send(messagesUser.slice(-limit));
    } catch (err){
        res.status(422).send(err.message);
    }
})

server.post("/status", async (req,res)=>{

    const {user}=req.headers;
    try{
        const userExists= await db.collection("users").findOne({name: user  });
        if(!userExists){
            return res.sendStatus(404);
        }
        await db.collection("users").updateOne({user},{$set: {lastStatus: Date.now}})
        res.sendStatus(200);
    }catch(err){
        res.status(500).send(err.message);
    }
})

setInterval(async ()=>{
    const seconds =Date.now()-(15*1000);
    console.log(seconds);
    try{
        exParticipants = await db.collection("user").find({ lastStatus:{$lte: seconds} }).toArray();
        if(exParticipants.length > 0 ){
            const noMessages= exParticipants.map(value=>{
                return ({
                from: exParticipants.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format("HH:MM:SS")
                });
            })
            await db.collection("messages").insertMany(noMessages);
            await db.collection("user").deleteMany({ lastStatus:{$lte: seconds} }).toArray();           
        }
    }catch(err){
        res.status(500).send(err.message);
    }

},15000)


server.listen(5000, ()=>{console.log("escutando 5000")})
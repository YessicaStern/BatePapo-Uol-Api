import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";

const server=express();
const mongoClient= new MongoClient(process.env.MONGO_URI);

dotenv.config();
server.use(cors());
server.use(express.json());

let db;

mongoClient.connect().then(()=>{db=mongoClient.db("batepapouol")});

server.get("/teste", (req,res)=>{
    console.log(db);
    res.send("okay");

})


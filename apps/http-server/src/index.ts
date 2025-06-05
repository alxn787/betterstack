import express from "express";
import prisma from "@repo/db/index";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("createwebsite",async(req,res)=>{
    if(!req.body.url){
        res.status(411).json({"message":"Missing url"});
        return;
    }
    const website = await prisma.website.create({
        data:{
            url:req.body.url,
            timeAdded:new Date()
        }
    })
    res.json({
        id:website?.id
    });
})

app.get("/status/:websiteId", async(req, res) => {

    const websiteId = req.params.websiteId;

    const status = await prisma.websiteTick.findFirst({
        where:{
            website_id:websiteId
        }
    })
})

app.post("showwebsites", async(req,res)=>{
    const { userId }  = req.body;
    const websites = await prisma.website.findMany();

    res.json(websites);

})

app.listen(3000);

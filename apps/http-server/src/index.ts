import express from "express";
import prisma from "@repo/db/index";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000);

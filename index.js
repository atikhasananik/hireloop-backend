import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;

// middenware
app.use(cors());
app.use(express.json());

// db connection
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const dbClient = await connectToMongoDB();
const db = dbClient.db("hireloop");
const jobs = db.collection("jobs");

app.get("/", (req, res) => {
  res.send("hello world");
});

// jobs post api
app.post("/job/new", async (req, res) => {
  const data = req.body;
  const result = await jobs.insertOne(data);
  console.log(data);
  res.send(result);
});

// get recruiter job
app.get("/get-recruiter-job/:email", async (req, res) => {
  const email = req?.params.email;
  const query = { jobPostBy: email };

  console.log(email);
  const result = await jobs.find(query).toArray();
  res.send(result);
});

app.delete("/delete-recruiter-job/:id", async (req, res) => {
  const _id = req.params.id;

  const result = await jobs.deleteOne({ _id: new ObjectId(_id) });
  res.send(result);
});

app.get("/get-single-job/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await jobs.findOne(query);
  res.send(result);
});

app.patch("/update-job/:id", async (req, res) => {
  const id = req.params.id;
  const query = req.body;
  console.log(query);
  const result = await jobs.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: query,
    },
  );

  res.send(result);
});

app.get("/get-filter-jobs", async (req, res) => {
  const queryParams = req.query;
  const query = {};

  if (queryParams.category) {
    query.category = queryParams.category;
  }
  if (queryParams.isRemote) {
    query.isRemote = queryParams.isRemote;
  }

  if (queryParams.jobType) {
    query.jobType = queryParams.jobType;
  }

  if (queryParams.search) {
    query.$or = [
      { title: { $regex: queryParams.search, $options: "i" } },
      { companyName: { $regex: queryParams.search, $options: "i" } },
      { location: { $regex: queryParams.search, $options: "i" } },
    ];
  }

  const cursor = jobs.find(query);
  const result = await cursor.toArray();
  
  res.send(result);
});

app.listen(PORT, () => {
  console.log(`Server running on this ${PORT}`);
});

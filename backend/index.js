import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";

import authRouter from "./src/routes/authRoute.js";

// ✅ IMPORT THE SINGLE PRISMA INSTANCE
import prisma from "./src/config/prisma.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("hello from server");
});

// auth routes
app.use("/api/auth", authRouter);

/**
 * ✅ Create a test user
 */
app.post("/test-user", async (req, res) => {
  try {
    const {
      name = "Test User",
      email = "testuser@gmail.com",
      password = "Test@12345",
      role = "EMPLOYEE",
    } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ message: "User created successfully", user });
  } catch (err) {
    console.error(err);

    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Fetch all users
 */
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, async () => {
  console.log("server started on port", port);

  try {
    await prisma.$connect();
    console.log("prisma connected");
  } catch (e) {
    console.error("prisma connection failed:", e.message);
  }
});

// ✅ clean shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.get("/db-test", async (req, res) => {
	try {
	  const users = await prisma.user.findMany({ take: 1 });
	  res.json({ ok: true, users });
	} catch (e) {
	  console.error("DB TEST ERROR:", e);
	  res.status(500).json({ ok: false, error: e.message });
	}
  });
  
import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/datasource";
import { appConfig } from "../config/app";
import { User } from "../entities/User";
import { authenticateToken } from "../middleware/auth";
import { createUserSchema, loginSchema } from "../utils/validation";
import { ResponseService } from "../utils/response";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);

router.post("/register", async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const { name, email, password } = validatedData;

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return ResponseService.json(
        res,
        400,
        "User already exists with this email"
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    await userRepository.save(user);

    return ResponseService.json(res, 201, "User created successfully");
  } catch (error) {
    console.error("Registration error:", error);
    return ResponseService.json(res, 500, "Registration failed");
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return ResponseService.json(res, 400, "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return ResponseService.json(res, 400, "Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn } as jwt.SignOptions
    );

    return ResponseService.json(res, 200, "Login successful", {
      user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return ResponseService.json(res, 500, "Login failed");
  }
});

router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    return ResponseService.json(
      res,
      200,
      "User profile retrieved successfully",
      user
    );
  } catch (error) {
    console.error("Get user error:", error);
    return ResponseService.json(res, 500, "Failed to retrieve user profile");
  }
});

export default router;

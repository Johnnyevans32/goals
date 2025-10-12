import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "../config/app";
import { User } from "@/entities";
import { AppDataSource } from "@/config/datasource";
import { ResponseService } from "@/utils/response";

const userRepository = AppDataSource.getRepository(User);

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    ResponseService.json(res, 401, "Access token required");
    return;
  }

  jwt.verify(token, appConfig.jwt.secret, async (err: any, decoded: any) => {
    if (err) {
      ResponseService.json(res, 401, "Unauthorized");
      return;
    }

    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });
    if (!user) {
      ResponseService.json(res, 401, "Unauthorized");
      return;
    }
    req.user = user;
    next();
  });
};

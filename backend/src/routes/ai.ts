import express, { Request, Response } from "express";
import { AppDataSource } from "../config/datasource";
import { authenticateToken } from "../middleware/auth";

import { Goal as GoalEntity } from "../entities/Goal";
import { GoalUpdate as GoalUpdateEntity } from "../entities/GoalUpdate";
import { OpenRouterService } from "../services/openrouter.service";
import { ResponseService } from "../utils/response";

const router = express.Router();
const openRouterService = new OpenRouterService();
const goalUpdateRepository = AppDataSource.getRepository(GoalUpdateEntity);

router.post(
  "/suggest-actions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { goalId } = req.body;

      if (!goalId) {
        return ResponseService.json(res, 400, "Goal ID is required");
      }

      const goalRepository = AppDataSource.getRepository(GoalEntity);
      const goal = await goalRepository.findOne({
        where: { id: goalId, user: { id: user.id } },
      });

      if (!goal) {
        return ResponseService.json(res, 404, "Goal not found");
      }

      const recentUpdates = await goalUpdateRepository.find({
        where: { goal: { id: goalId } },
        order: { created_at: "DESC" },
        take: 3,
      });

      const suggestions = await openRouterService.generateActionSuggestions(
        goal.title,
        goal.description || "",
        goal.target_value,
        goal.current_value,
        goal.unit || "",
        recentUpdates.map((update) => ({
          new_value: update.new_value,
          previous_value: update.previous_value,
          notes: update.notes || "",
          created_at: update.created_at,
        }))
      );

      return ResponseService.json(
        res,
        200,
        "Action suggestions generated successfully",
        suggestions
      );
    } catch (error: any) {
      console.error("Suggest actions error:", error);
      return ResponseService.json(
        res,
        400,
        error.message || "Failed to generate action suggestions"
      );
    }
  }
);

router.post(
  "/summarize-checkin",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { goalId } = req.body;

      if (!goalId) {
        return ResponseService.json(res, 400, "Goal ID is required");
      }

      const goalRepository = AppDataSource.getRepository(GoalEntity);
      const goalUpdateRepository =
        AppDataSource.getRepository(GoalUpdateEntity);

      const goal = await goalRepository.findOne({
        where: { id: goalId, user: { id: user.id } },
      });

      if (!goal) {
        return ResponseService.json(res, 404, "Goal not found");
      }

      const lastUpdate = await goalUpdateRepository.findOne({
        where: { goal: { id: goalId } },
        order: { created_at: "DESC" },
      });

      const summary = await openRouterService.generateCheckinSummary(
        goal.title,
        goal.description || "",
        goal.target_value,
        goal.current_value,
        goal.unit || "",
        lastUpdate
          ? {
              new_value: lastUpdate.new_value,
              previous_value: lastUpdate.previous_value,
              notes: lastUpdate.notes || "",
              created_at: lastUpdate.created_at,
            }
          : undefined
      );

      return ResponseService.json(
        res,
        200,
        "Check-in summary generated successfully",
        summary
      );
    } catch (error: any) {
      console.error("Summarize check-in error:", error);
      return ResponseService.json(
        res,
        400,
        error.message || "Failed to generate check-in summary"
      );
    }
  }
);

export default router;

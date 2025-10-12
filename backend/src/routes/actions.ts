import express, { Request, Response } from "express";
import { AppDataSource } from "../config/datasource";
import { Action } from "../entities/Action";
import { ActionStatus } from "../types";
import { Goal } from "../entities/Goal";
import { authenticateToken } from "../middleware/auth";
import { createActionSchema, updateActionSchema } from "../utils/validation";
import { ResponseService } from "../utils/response";

const router = express.Router();
const actionRepository = AppDataSource.getRepository(Action);
const goalRepository = AppDataSource.getRepository(Goal);

router.get(
  "/:goalId/actions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const goalId = parseInt(req.params.goalId);
      const {
        status,
        search,
        due_soon,
        page = 1,
        per_page = 10,
        all,
      } = req.query;

      if (isNaN(goalId)) {
        return ResponseService.json(res, 400, "Invalid goal ID");
      }

      const goal = await goalRepository.findOne({
        where: { id: goalId, user: { id: user.id } },
      });

      if (!goal) {
        return ResponseService.json(res, 404, "Goal not found");
      }

      const whereConditions: any = { goal: { id: goalId } };

      if (status && typeof status === "string") {
        whereConditions.status = status;
      }

      if (search && typeof search === "string") {
        whereConditions.title = { $like: `%${search}%` };
      }

      if (due_soon === "true") {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        whereConditions.due_date = { $lte: threeDaysFromNow };
      }

      if (all === "true") {
        const actions = await actionRepository.find({
          where: whereConditions,
          order: { due_date: "ASC", created_at: "DESC" },
        });

        return ResponseService.json(
          res,
          200,
          "Actions retrieved successfully",
          actions
        );
      }

      const pageNum = parseInt(page as string) || 1;
      const perPage = parseInt(per_page as string) || 10;

      const [actions, total] = await actionRepository.findAndCount({
        where: whereConditions,
        order: { due_date: "ASC", created_at: "DESC" },
        skip: (pageNum - 1) * perPage,
        take: perPage,
      });

      const total_pages = Math.ceil(total / perPage);

      const metadata = {
        page: pageNum,
        per_page: perPage,
        total,
        has_next: pageNum < total_pages,
        has_prev: pageNum > 1,
        total_pages,
      };

      return ResponseService.json(
        res,
        200,
        "Actions retrieved successfully",
        actions,
        metadata
      );
    } catch (error) {
      console.error("Get actions error:", error);
      return ResponseService.json(res, 500, "Failed to retrieve actions");
    }
  }
);

router.post(
  "/:goalId/actions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const goalId = parseInt(req.params.goalId);
      const validatedData = createActionSchema.parse(req.body);

      if (isNaN(goalId)) {
        return ResponseService.json(res, 400, "Invalid goal ID");
      }

      const goal = await goalRepository.findOne({
        where: { id: goalId, user: { id: user.id } },
      });

      if (!goal) {
        return ResponseService.json(res, 404, "Goal not found");
      }

      const action = actionRepository.create({
        ...validatedData,
        goal,
        status: ActionStatus.TODO,
        user,
      });

      const savedAction = await actionRepository.save(action);

      return ResponseService.json(res, 201, "Action created successfully", {
        id: savedAction.id,
      });
    } catch (error) {
      console.error("Create action error:", error);
      return ResponseService.json(res, 500, "Failed to create action");
    }
  }
);

router.patch(
  "/:goalId/actions/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const actionId = parseInt(req.params.id);
      const goalId = parseInt(req.params.goalId);
      const validatedData = updateActionSchema.parse(req.body);

      if (isNaN(actionId)) {
        return ResponseService.json(res, 400, "Invalid action ID");
      }

      const action = await actionRepository.findOne({
        where: { id: actionId, user: { id: user.id }, goal: { id: goalId } },
        relations: ["goal"],
      });

      if (!action) {
        return ResponseService.json(res, 404, "Action not found");
      }

      Object.assign(action, validatedData);
      const updatedAction = await actionRepository.save(action);

      return ResponseService.json(res, 200, "Action updated successfully", {
        id: updatedAction.id,
      });
    } catch (error) {
      console.error("Update action error:", error);
      return ResponseService.json(res, 500, "Failed to update action");
    }
  }
);

router.delete(
  "/:goalId/actions/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const actionId = parseInt(req.params.id);
      const goalId = parseInt(req.params.goalId);

      if (isNaN(actionId)) {
        return ResponseService.json(res, 400, "Invalid action ID");
      }

      const action = await actionRepository.findOne({
        where: { id: actionId, user: { id: user.id }, goal: { id: goalId } },
        relations: ["goal"],
      });

      if (!action) {
        return ResponseService.json(res, 404, "Action not found");
      }

      await actionRepository.remove(action);

      return ResponseService.json(res, 200, "Action deleted successfully");
    } catch (error) {
      console.error("Delete action error:", error);
      return ResponseService.json(res, 500, "Failed to delete action");
    }
  }
);

router.get(
  "/:goalId/actions/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const actionId = parseInt(req.params.id);
      const goalId = parseInt(req.params.goalId);

      if (isNaN(actionId)) {
        return ResponseService.json(res, 400, "Invalid action ID");
      }

      const action = await actionRepository.findOne({
        where: { id: actionId, user: { id: user.id }, goal: { id: goalId } },
        relations: ["goal"],
      });

      if (!action) {
        return ResponseService.json(res, 404, "Action not found");
      }

      return ResponseService.json(
        res,
        200,
        "Action retrieved successfully",
        action
      );
    } catch (error) {
      console.error("Get action error:", error);
      return ResponseService.json(res, 500, "Failed to retrieve action");
    }
  }
);

export default router;

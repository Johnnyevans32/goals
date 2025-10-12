import express, { NextFunction, Response, Request } from "express";
import { AppDataSource } from "../config/datasource";
import { Goal } from "../entities/Goal";
import { Action } from "../entities/Action";
import { ActionStatus, GoalStatus } from "../types";
import { GoalUpdate } from "../entities/GoalUpdate";
import { authenticateToken } from "../middleware/auth";
import {
  createGoalSchema,
  updateGoalSchema,
  createGoalUpdateSchema,
} from "../utils/validation";
import { ResponseService } from "../utils/response";
import { computeGoalStatus } from "../utils/drift";

const router = express.Router();
const goalRepository = AppDataSource.getRepository(Goal);
const actionRepository = AppDataSource.getRepository(Action);
const goalUpdateRepository = AppDataSource.getRepository(GoalUpdate);

router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const user = req.user!;
      const { page = 1, per_page = 10, all } = req.query;

      if (all === "true") {
        const goals = await goalRepository.find({
          where: { user },
          relations: ["actions", "goal_updates"],
          order: { created_at: "DESC" },
        });

        goals.forEach((goal) => {
          goal.status = computeGoalStatus(
            goal.current_value,
            goal.target_value,
            goal.due_date
          );
        });

        return ResponseService.json(
          res,
          200,
          "Goals retrieved successfully",
          goals
        );
      }

      const pageNum = parseInt(page as string) || 1;
      const perPage = parseInt(per_page as string) || 10;

      const [goals, total] = await goalRepository.findAndCount({
        where: { user: { id: user.id } },
        relations: ["actions", "goal_updates"],
        order: { created_at: "DESC" },
        skip: (pageNum - 1) * perPage,
        take: perPage,
      });

      goals.forEach((goal) => {
        goal.status = computeGoalStatus(
          goal.current_value,
          goal.target_value,
          goal.due_date
        );
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
        "Goals retrieved successfully",
        goals,
        metadata
      );
    } catch (error: any) {
      console.error("Get goals error:", error);
      return ResponseService.json(
        res,
        400,
        error.message || "Failed to retrieve goals"
      );
    }
  }
);

router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const goalId = parseInt(req.params.id);

    if (isNaN(goalId)) {
      return ResponseService.json(res, 400, "Invalid goal ID");
    }

    const goal = await goalRepository.findOne({
      where: { id: goalId, user: { id: user.id } },
      relations: ["actions", "goal_updates"],
    });

    if (!goal) {
      return ResponseService.json(res, 404, "Goal not found");
    }

    goal.status = computeGoalStatus(
      goal.current_value,
      goal.target_value,
      goal.due_date
    );
    await goalRepository.save(goal);

    return ResponseService.json(res, 200, "Goal retrieved successfully", goal);
  } catch (error: any) {
    console.error("Get goal error:", error);
    return ResponseService.json(
      res,
      400,
      error.message || "Failed to retrieve goal"
    );
  }
});

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const validatedData = createGoalSchema.parse(req.body);

    const goal = goalRepository.create({
      ...validatedData,
      user,
      status: GoalStatus.ON_TRACK,
    });

    const savedGoal = await goalRepository.save(goal);

    return ResponseService.json(res, 201, "Goal created successfully", {
      id: savedGoal.id,
    });
  } catch (error: any) {
    console.error("Create goal error:", error);
    return ResponseService.json(
      res,
      400,
      error.message || "Failed to create goal"
    );
  }
});

router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const goalId = parseInt(req.params.id);

    if (isNaN(goalId)) {
      return ResponseService.json(res, 400, "Invalid goal ID");
    }

    const validatedData = updateGoalSchema.parse(req.body);

    const goal = await goalRepository.findOne({
      where: { id: goalId, user: { id: user.id } },
    });

    if (!goal) {
      return ResponseService.json(res, 404, "Goal not found");
    }

    Object.assign(goal, validatedData);
    const updatedGoal = await goalRepository.save(goal);

    return ResponseService.json(res, 200, "Goal updated successfully", {
      id: updatedGoal.id,
    });
  } catch (error: any) {
    console.error("Update goal error:", error);
    return ResponseService.json(
      res,
      400,
      error.message || "Failed to update goal"
    );
  }
});

router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const goalId = parseInt(req.params.id);

      if (isNaN(goalId)) {
        return ResponseService.json(res, 400, "Invalid goal ID");
      }

      const goal = await goalRepository.findOne({
        where: { id: goalId, user: { id: user.id } },
      });

      if (!goal) {
        return ResponseService.json(res, 404, "Goal not found");
      }

      await goalRepository.remove(goal);

      return ResponseService.json(res, 200, "Goal deleted successfully");
    } catch (error: any) {
      console.error("Delete goal error:", error);
      return ResponseService.json(
        res,
        400,
        error.message || "Failed to delete goal"
      );
    }
  }
);

router.post(
  "/:id/updates",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const goalId = parseInt(req.params.id);

      if (isNaN(goalId)) {
        return ResponseService.json(res, 400, "Invalid goal ID");
      }

      const validatedData = createGoalUpdateSchema.parse(req.body);

      const goal = await goalRepository.findOne({
        where: { id: goalId, user: { id: user.id } },
      });

      if (!goal) {
        return ResponseService.json(res, 404, "Goal not found");
      }

      const previous_value = goal.current_value;
      goal.current_value = validatedData.value;
      goal.status = computeGoalStatus(
        validatedData.value,
        goal.target_value,
        goal.due_date
      );
      await goalRepository.save(goal);

      const goalUpdate = goalUpdateRepository.create({
        new_value: validatedData.value,
        notes: validatedData.note,
        goal,
        previous_value,
      });

      const savedUpdate = await goalUpdateRepository.save(goalUpdate);

      return ResponseService.json(
        res,
        201,
        "Goal update created successfully",
        { id: savedUpdate.id }
      );
    } catch (error: any) {
      console.error("Create goal update error:", error);
      return ResponseService.json(
        res,
        400,
        error.message || "Failed to create goal update"
      );
    }
  }
);

router.get(
  "/stats/dashboard",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      const goalStats = await goalRepository
        .createQueryBuilder("goal")
        .select("COUNT(*)", "total_count")
        .addSelect(
          "SUM(CASE WHEN goal.status = :onTrack THEN 1 ELSE 0 END)",
          "on_track_count"
        )
        .addSelect(
          "SUM(CASE WHEN goal.status = :offTrack THEN 1 ELSE 0 END)",
          "off_track_count"
        )
        .addSelect(
          "SUM(CASE WHEN goal.status = :atRisk THEN 1 ELSE 0 END)",
          "at_risk_count"
        )
        .where("goal.user_id = :userId")
        .setParameters({
          userId: user.id,
          onTrack: GoalStatus.ON_TRACK,
          offTrack: GoalStatus.OFF_TRACK,
          atRisk: GoalStatus.AT_RISK,
        })
        .getRawOne();

      const actionStats = await actionRepository
        .createQueryBuilder("action")
        .select("COUNT(*)", "total_count")
        .addSelect(
          "SUM(CASE WHEN action.status = :todo THEN 1 ELSE 0 END)",
          "todo_count"
        )
        .addSelect(
          "SUM(CASE WHEN action.status = :done THEN 1 ELSE 0 END)",
          "done_count"
        )
        .addSelect(
          "SUM(CASE WHEN action.status = :inProgress THEN 1 ELSE 0 END)",
          "in_progress_count"
        )
        .innerJoin("action.goal", "goal")
        .where("goal.user_id = :userId")
        .setParameters({
          userId: user.id,
          todo: ActionStatus.TODO,
          done: ActionStatus.DONE,
          inProgress: ActionStatus.IN_PROGRESS,
        })
        .getRawOne();

      const stats = {
        totalGoals: parseInt(goalStats?.total_count) || 0,
        onTrackGoals: parseInt(goalStats?.on_track_count) || 0,
        offTrackGoals: parseInt(goalStats?.off_track_count) || 0,
        atRiskGoals: parseInt(goalStats?.at_risk_count) || 0,
        totalActions: parseInt(actionStats?.total_count) || 0,
        activeActions: parseInt(actionStats?.todo_count) || 0,
        completedActions: parseInt(actionStats?.done_count) || 0,
        inProgressActions: parseInt(actionStats?.in_progress_count) || 0,
      };

      return ResponseService.json(
        res,
        200,
        "Dashboard stats retrieved successfully",
        stats
      );
    } catch (error: any) {
      console.error("Get dashboard stats error:", error);
      return ResponseService.json(
        res,
        400,
        error.message || "Failed to retrieve dashboard stats"
      );
    }
  }
);

export default router;

import express, { NextFunction, Response, Request } from "express";
import { AppDataSource } from "../config/datasource";
import { Goal } from "../entities/Goal";
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
    } catch (error) {
      console.error("Get goals error:", error);
      return ResponseService.json(res, 500, "Failed to retrieve goals");
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

    return ResponseService.json(res, 200, "Goal retrieved successfully", goal);
  } catch (error) {
    console.error("Get goal error:", error);
    return ResponseService.json(res, 500, "Failed to retrieve goal");
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
  } catch (error) {
    console.error("Create goal error:", error);
    return ResponseService.json(res, 500, "Failed to create goal");
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
  } catch (error) {
    console.error("Update goal error:", error);
    return ResponseService.json(res, 500, "Failed to update goal");
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
    } catch (error) {
      console.error("Delete goal error:", error);
      return ResponseService.json(res, 500, "Failed to delete goal");
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
      return ResponseService.json(res, 400, error.message);
    }
  }
);

router.get(
  "/stats/dashboard",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      const rawResults = await goalRepository
        .createQueryBuilder("goal")
        .select([
          "stats_type",
          "total_count",
          "on_track_count",
          "off_track_count",
          "at_risk_count",
          "todo_count",
          "done_count",
          "in_progress_count",
        ])
        .from((qb: any) => {
          const goalSubQuery = qb
            .subQuery()
            .select("'goals'", "stats_type")
            .addSelect("COUNT(*)", "total_count")
            .addSelect(
              "SUM(CASE WHEN status = :onTrack THEN 1 ELSE 0 END)",
              "on_track_count"
            )
            .addSelect(
              "SUM(CASE WHEN status = :offTrack THEN 1 ELSE 0 END)",
              "off_track_count"
            )
            .addSelect(
              "SUM(CASE WHEN status = :atRisk THEN 1 ELSE 0 END)",
              "at_risk_count"
            )
            .addSelect("0", "todo_count")
            .addSelect("0", "done_count")
            .addSelect("0", "in_progress_count")
            .from("goals", "g")
            .where("g.user_id = :userId")
            .getQuery();

          const actionSubQuery = qb
            .subQuery()
            .select("'actions'", "stats_type")
            .addSelect("COUNT(*)", "total_count")
            .addSelect("0", "on_track_count")
            .addSelect("0", "off_track_count")
            .addSelect("0", "at_risk_count")
            .addSelect(
              "SUM(CASE WHEN a.status = :todo THEN 1 ELSE 0 END)",
              "todo_count"
            )
            .addSelect(
              "SUM(CASE WHEN a.status = :done THEN 1 ELSE 0 END)",
              "done_count"
            )
            .addSelect(
              "SUM(CASE WHEN a.status = :inProgress THEN 1 ELSE 0 END)",
              "in_progress_count"
            )
            .from("actions", "a")
            .innerJoin("goals", "g", "a.goal_id = g.id")
            .where("g.user_id = :userId")
            .getQuery();

          return `(${goalSubQuery}) UNION ALL (${actionSubQuery})`;
        }, "combined_stats")
        .setParameters({
          userId: user.id,
          onTrack: GoalStatus.ON_TRACK,
          offTrack: GoalStatus.OFF_TRACK,
          atRisk: GoalStatus.AT_RISK,
          todo: ActionStatus.TODO,
          done: ActionStatus.DONE,
          inProgress: ActionStatus.IN_PROGRESS,
        })
        .getRawMany();

      const goalStats = rawResults.find((r) => r.stats_type === "goals");
      const actionStats = rawResults.find((r) => r.stats_type === "actions");

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
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      return ResponseService.json(
        res,
        500,
        "Failed to retrieve dashboard stats"
      );
    }
  }
);

export default router;

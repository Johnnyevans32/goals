import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  target_value: z.number().positive("Target value must be positive"),
  unit: z
    .string()
    .min(1, "Unit is required")
    .max(255, "Unit too long")
    .optional(),
  due_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
});

export const updateGoalSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  target_value: z.number().positive("Target value must be positive").optional(),
  due_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .optional(),
});

export const createActionSchema = z.object({
  goal_id: z.number().positive("Goal ID is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  due_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
});

export const updateActionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  due_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

export const createGoalUpdateSchema = z.object({
  value: z.number().min(0, "Value must be non-negative"),
  note: z.string().max(1000, "Note too long").optional(),
});

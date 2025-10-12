import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { Goal } from "./Goal";
import { User } from "./User";

@Entity("goal_updates")
export class GoalUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 10, scale: 2 })
  previous_value: number;

  @Column("decimal", { precision: 10, scale: 2 })
  new_value: number;

  @Column("text", { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.goal_updates)
  user: User;

  @ManyToOne(() => Goal, (goal) => goal.goal_updates)
  goal: Goal;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { ActionStatus, EffortLevel } from "../types";
import { Goal } from "./Goal";
import { User } from "./User";

@Entity("actions")
@Index(["user", "status"])
@Index(["goal", "status"])
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column("text", { nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ActionStatus,
    default: ActionStatus.TODO,
  })
  status: ActionStatus;

  @Column({
    type: "enum",
    enum: EffortLevel,
    nullable: true,
  })
  effort: EffortLevel;

  @Column("date", { nullable: true })
  due_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.actions)
  user: User;

  @ManyToOne(() => Goal, (goal) => goal.actions)
  goal: Goal;
}

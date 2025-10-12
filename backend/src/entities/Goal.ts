import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from "typeorm";
import { User } from "./User";
import { GoalStatus } from "../types";
import { Action } from "./Action";
import { GoalUpdate } from "./GoalUpdate";

@Entity("goals")
@Index(["user", "status"])
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column("text", { nullable: true })
  description: string;

  @Column("decimal", { precision: 10, scale: 2 })
  target_value: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  current_value: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column("date", { nullable: true })
  due_date: Date;

  @Column({
    type: "enum",
    enum: GoalStatus,
    default: GoalStatus.ON_TRACK,
  })
  status: GoalStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.goals)
  user: User;

  @OneToMany(() => Action, (action) => action.goal)
  actions: Action[];

  @OneToMany(() => GoalUpdate, (goalUpdate) => goalUpdate.goal)
  goal_updates: GoalUpdate[];
}

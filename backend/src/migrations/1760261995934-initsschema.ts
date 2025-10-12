import { MigrationInterface, QueryRunner } from "typeorm";

export class Initsschema1760261995934 implements MigrationInterface {
    name = 'Initsschema1760261995934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."actions_status_enum" AS ENUM('todo', 'in_progress', 'done')`);
        await queryRunner.query(`CREATE TYPE "public"."actions_effort_enum" AS ENUM('S', 'M', 'L')`);
        await queryRunner.query(`CREATE TABLE "actions" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "status" "public"."actions_status_enum" NOT NULL DEFAULT 'todo', "effort" "public"."actions_effort_enum", "due_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, "goal_id" integer, CONSTRAINT "PK_7bfb822f56be449c0b8adbf83cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0efe973368e87726e09c08f775" ON "actions" ("goal_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b3c0bc065c54cf946391cf6e8" ON "actions" ("user_id", "status") `);
        await queryRunner.query(`CREATE TABLE "goal_updates" ("id" SERIAL NOT NULL, "previous_value" numeric(10,2) NOT NULL, "new_value" numeric(10,2) NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, "goal_id" integer, CONSTRAINT "PK_d9ac2ea1afd0ebd6a9d5170736b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."goals_status_enum" AS ENUM('on_track', 'at_risk', 'off_track')`);
        await queryRunner.query(`CREATE TABLE "goals" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "target_value" numeric(10,2) NOT NULL, "current_value" numeric(10,2) NOT NULL DEFAULT '0', "unit" character varying(50), "due_date" date, "status" "public"."goals_status_enum" NOT NULL DEFAULT 'on_track', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4efcaf12b912943275f286356c" ON "goals" ("user_id", "status") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "actions" ADD CONSTRAINT "FK_314aaf9c37b61b0a1267c1f4b59" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "actions" ADD CONSTRAINT "FK_e4599aa0b88c3397b4bf5ad0f2a" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goal_updates" ADD CONSTRAINT "FK_8cf1661496991c2ac3cec2a8e0b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goal_updates" ADD CONSTRAINT "FK_aeaacd33c91cb302452e03b2d8c" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_88b78010581f2d293699d064441" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_88b78010581f2d293699d064441"`);
        await queryRunner.query(`ALTER TABLE "goal_updates" DROP CONSTRAINT "FK_aeaacd33c91cb302452e03b2d8c"`);
        await queryRunner.query(`ALTER TABLE "goal_updates" DROP CONSTRAINT "FK_8cf1661496991c2ac3cec2a8e0b"`);
        await queryRunner.query(`ALTER TABLE "actions" DROP CONSTRAINT "FK_e4599aa0b88c3397b4bf5ad0f2a"`);
        await queryRunner.query(`ALTER TABLE "actions" DROP CONSTRAINT "FK_314aaf9c37b61b0a1267c1f4b59"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4efcaf12b912943275f286356c"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP TYPE "public"."goals_status_enum"`);
        await queryRunner.query(`DROP TABLE "goal_updates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b3c0bc065c54cf946391cf6e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0efe973368e87726e09c08f775"`);
        await queryRunner.query(`DROP TABLE "actions"`);
        await queryRunner.query(`DROP TYPE "public"."actions_effort_enum"`);
        await queryRunner.query(`DROP TYPE "public"."actions_status_enum"`);
    }

}

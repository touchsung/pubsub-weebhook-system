import { Either, right, left, isLeft } from "fp-ts/Either";
import { Option, some, none, isSome } from "fp-ts/Option";
import { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ISubscriberRepository } from "@/repositories/interfaces/ISubscriberRepository";
import { Subscriber, CreateSubscriber } from "@/domain/entities/Subscriber";
import { tryCatchAsync } from "@/utils/functional/Either";
import { nanoid } from "nanoid";

export class SubscriberRepository implements ISubscriberRepository {
  constructor(private readonly db: Connection) {}

  async create(data: CreateSubscriber): Promise<Either<Error, Subscriber>> {
    const secret = nanoid(32);

    return tryCatchAsync(async () => {
      const [result] = await this.db.execute<ResultSetHeader>(
        "INSERT INTO subscriber (url, secret, is_active) VALUES (?, ?, TRUE)",
        [data.url, secret]
      );

      return {
        sub_id: result.insertId,
        url: data.url,
        secret,
        is_active: true,
      };
    });
  }

  async findById(sub_id: number): Promise<Either<Error, Option<Subscriber>>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT sub_id, url, secret, is_active FROM subscriber WHERE sub_id = ?",
        [sub_id]
      );

      if (rows.length === 0) {
        return none;
      }

      const row = rows[0];
      return some({
        sub_id: row.sub_id,
        url: row.url,
        secret: row.secret,
        is_active: Boolean(row.is_active),
      });
    });
  }

  async findByUrl(url: string): Promise<Either<Error, Option<Subscriber>>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT sub_id, url, secret, is_active FROM subscriber WHERE url = ?",
        [url]
      );

      if (rows.length === 0) {
        return none;
      }

      const row = rows[0];
      return some({
        sub_id: row.sub_id,
        url: row.url,
        secret: row.secret,
        is_active: Boolean(row.is_active),
      });
    });
  }

  async findAll(): Promise<Either<Error, Subscriber[]>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT sub_id, url, secret, is_active FROM subscriber ORDER BY created_at DESC"
      );

      return rows.map((row) => ({
        sub_id: row.sub_id,
        url: row.url,
        secret: row.secret,
        is_active: Boolean(row.is_active),
      }));
    });
  }

  async findAllActive(): Promise<Either<Error, Subscriber[]>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT sub_id, url, secret, is_active FROM subscriber WHERE is_active = TRUE ORDER BY created_at DESC"
      );

      return rows.map((row) => ({
        sub_id: row.sub_id,
        url: row.url,
        secret: row.secret,
        is_active: Boolean(row.is_active),
      }));
    });
  }

  async updateById(
    sub_id: number,
    updates: Partial<Subscriber>
  ): Promise<Either<Error, Subscriber>> {
    return tryCatchAsync(async () => {
      const setClause = [];
      const values = [];

      if (updates.url !== undefined) {
        setClause.push("url = ?");
        values.push(updates.url);
      }
      if (updates.secret !== undefined) {
        setClause.push("secret = ?");
        values.push(updates.secret);
      }
      if (updates.is_active !== undefined) {
        setClause.push("is_active = ?");
        values.push(updates.is_active);
      }

      if (setClause.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(sub_id);

      await this.db.execute(
        `UPDATE subscriber SET ${setClause.join(", ")} WHERE sub_id = ?`,
        values
      );

      const findResult = await this.findById(sub_id);
      if (isLeft(findResult)) {
        throw findResult.left;
      }
      if (!isSome(findResult.right)) {
        throw new Error(`Subscriber ${sub_id} not found after update`);
      }

      return findResult.right.value;
    });
  }

  async updateByUrl(
    url: string,
    updates: Partial<Subscriber>
  ): Promise<Either<Error, Subscriber>> {
    return tryCatchAsync(async () => {
      const setClause = [];
      const values = [];

      if (updates.secret !== undefined) {
        setClause.push("secret = ?");
        values.push(updates.secret);
      }
      if (updates.is_active !== undefined) {
        setClause.push("is_active = ?");
        values.push(updates.is_active);
      }

      if (setClause.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(url);

      await this.db.execute(
        `UPDATE subscriber SET ${setClause.join(", ")} WHERE url = ?`,
        values
      );

      const findResult = await this.findByUrl(url);
      if (isLeft(findResult)) {
        throw findResult.left;
      }
      if (!isSome(findResult.right)) {
        throw new Error(`Subscriber with URL ${url} not found after update`);
      }

      return findResult.right.value;
    });
  }

  async activateById(sub_id: number): Promise<Either<Error, Subscriber>> {
    return this.updateById(sub_id, { is_active: true });
  }

  async deactivateById(sub_id: number): Promise<Either<Error, Subscriber>> {
    return this.updateById(sub_id, { is_active: false });
  }

  async upsertByUrl(
    data: CreateSubscriber
  ): Promise<Either<Error, { subscriber: Subscriber; wasUpdated: boolean }>> {
    return tryCatchAsync(async () => {
      const existingResult = await this.findByUrl(data.url);
      if (isLeft(existingResult)) {
        throw existingResult.left;
      }

      if (isSome(existingResult.right)) {
        const newSecret = nanoid(32);
        const updateResult = await this.updateByUrl(data.url, {
          is_active: true,
          secret: newSecret,
        });

        if (isLeft(updateResult)) {
          throw updateResult.left;
        }

        return {
          subscriber: updateResult.right,
          wasUpdated: true,
        };
      } else {
        const createResult = await this.create(data);
        if (isLeft(createResult)) {
          throw createResult.left;
        }

        return {
          subscriber: createResult.right,
          wasUpdated: false,
        };
      }
    });
  }
}

import { Either, right, left } from "fp-ts/Either";
import { Option, some, none } from "fp-ts/Option";
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
        "INSERT INTO subscriber (url, secret) VALUES (?, ?)",
        [data.url, secret]
      );

      return {
        sub_id: result.insertId,
        url: data.url,
        secret,
      };
    });
  }

  async findById(sub_id: number): Promise<Either<Error, Option<Subscriber>>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT sub_id, url, secret FROM subscriber WHERE sub_id = ?",
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
      });
    });
  }

  async findAll(): Promise<Either<Error, Subscriber[]>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT sub_id, url, secret FROM subscriber"
      );

      return rows.map((row) => ({
        sub_id: row.sub_id,
        url: row.url,
        secret: row.secret,
      }));
    });
  }

  async deleteById(sub_id: number): Promise<Either<Error, boolean>> {
    return tryCatchAsync(async () => {
      const [result] = await this.db.execute<ResultSetHeader>(
        "DELETE FROM subscriber WHERE sub_id = ?",
        [sub_id]
      );

      return result.affectedRows > 0;
    });
  }
}

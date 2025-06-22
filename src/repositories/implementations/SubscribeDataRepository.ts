import { Either } from "fp-ts/Either";
import { Option, some, none } from "fp-ts/Option";
import { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ISubscribeDataRepository } from "@/repositories/interfaces/ISubscribeDataRepository";
import {
  SubscribeData,
  CreateSubscribeData,
} from "@/domain/entities/SubscribeData";
import { tryCatchAsync } from "@/utils/functional/Either";

export class SubscribeDataRepository implements ISubscribeDataRepository {
  constructor(private readonly db: Connection) {}

  async create(
    data: CreateSubscribeData
  ): Promise<Either<Error, SubscribeData>> {
    return tryCatchAsync(async () => {
      const [result] = await this.db.execute<ResultSetHeader>(
        "INSERT INTO subscribe_data (message) VALUES (?)",
        [data.message]
      );

      return {
        tx_id: result.insertId,
        message: data.message,
      };
    });
  }

  async findById(tx_id: number): Promise<Either<Error, Option<SubscribeData>>> {
    return tryCatchAsync(async () => {
      const [rows] = await this.db.execute<RowDataPacket[]>(
        "SELECT tx_id, message FROM subscribe_data WHERE tx_id = ?",
        [tx_id]
      );

      if (rows.length === 0) {
        return none;
      }

      const row = rows[0];
      return some({
        tx_id: row.tx_id,
        message: row.message,
      });
    });
  }
}

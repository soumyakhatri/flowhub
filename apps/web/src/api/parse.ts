import { asRecord, mergeData } from "./client";

export function unwrapEntity(body: unknown, key: string): unknown {
  const record = mergeData(body);
  const nested = record[key];
  if (nested && typeof nested === "object") return nested;
  const direct = asRecord(body);
  if (direct && direct[key] && typeof direct[key] === "object") return direct[key];
  return record;
}
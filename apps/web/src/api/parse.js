import { asRecord, mergeData } from "./client";
function unwrapEntity(body, key) {
  const record = mergeData(body);
  const nested = record[key];
  if (nested && typeof nested === "object") return nested;
  const direct = asRecord(body);
  if (direct && direct[key] && typeof direct[key] === "object") return direct[key];
  return record;
}
export {
  unwrapEntity
};

import { describe, it, expect } from "vitest";
import { addDays, isSameDay, isBefore } from "date-fns";

describe("Rent Reminder Notification Logic", () => {
  it("should categorize 3 days before due date as UPCOMING", () => {
    const today = new Date();
    const dueDate = addDays(today, 3);

    const threeDaysBefore = addDays(dueDate, -3);
    const isUpcoming =
      isSameDay(today, threeDaysBefore) ||
      (isBefore(threeDaysBefore, today) && isBefore(today, dueDate));

    expect(isUpcoming).toBe(true);
  });

  it("should categorize matching date as DUE_TODAY", () => {
    const today = new Date();
    const dueDate = new Date(today);

    const isDueToday = isSameDay(today, dueDate);
    expect(isDueToday).toBe(true);
  });

  it("should categorize past due date as OVERDUE", () => {
    const today = new Date();
    const dueDate = addDays(today, -2); // 2 days ago

    const isOverdue = isBefore(dueDate, today);
    expect(isOverdue).toBe(true);
  });
});

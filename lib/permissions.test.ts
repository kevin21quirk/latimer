import { describe, expect, it } from "vitest";
import { canInitiateDirectMessage, hasPermission, roleOf } from "./permissions";

const resident = { accountType: "INDIVIDUAL", isAdmin: false };
const charity = { accountType: "CHARITY", isAdmin: false };
const business = { accountType: "COMPANY", isAdmin: false };
const admin = { accountType: "INDIVIDUAL", isAdmin: true };

describe("roleOf", () => {
  it("maps account types and honours isAdmin", () => {
    expect(roleOf(resident)).toBe("RESIDENT");
    expect(roleOf(charity)).toBe("CHARITY");
    expect(roleOf(business)).toBe("BUSINESS");
    expect(roleOf(admin)).toBe("ADMIN");
  });
});

describe("hasPermission", () => {
  it("hides help requests from business accounts", () => {
    expect(hasPermission(business, "help-requests:view")).toBe(false);
    expect(hasPermission(business, "help-requests:respond")).toBe(false);
    expect(hasPermission(resident, "help-requests:view")).toBe(true);
    expect(hasPermission(charity, "help-requests:view")).toBe(true);
    expect(hasPermission(admin, "help-requests:view")).toBe(true);
  });

  it("restricts moderation and admin access to admins", () => {
    expect(hasPermission(resident, "moderation:review")).toBe(false);
    expect(hasPermission(business, "admin:access")).toBe(false);
    expect(hasPermission(admin, "moderation:review")).toBe(true);
    expect(hasPermission(admin, "admin:access")).toBe(true);
  });

  it("denies everything to anonymous visitors", () => {
    expect(hasPermission(null, "community:ask")).toBe(false);
    expect(hasPermission(undefined, "marketplace:access")).toBe(false);
  });
});

describe("canInitiateDirectMessage", () => {
  it("blocks businesses from starting conversations with residents", () => {
    expect(canInitiateDirectMessage(business, resident)).toBe(false);
    expect(canInitiateDirectMessage(resident, resident)).toBe(true);
    expect(canInitiateDirectMessage(resident, business)).toBe(true);
    expect(canInitiateDirectMessage(business, charity)).toBe(true);
    expect(canInitiateDirectMessage(business, business)).toBe(true);
  });
});

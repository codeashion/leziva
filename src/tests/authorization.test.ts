import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RoleType } from "@prisma/client";

// Simulation of the RBAC role checker logic in guards
function checkUserRoleAccess(userRoles: RoleType[], allowedRoles: RoleType[]): boolean {
  return userRoles.some(
    (role) => role === RoleType.SUPER_ADMIN || allowedRoles.includes(role)
  );
}

describe("Authorization & RBAC Security Matrix", () => {
  it("should allow CUSTOMER to access customer endpoints", () => {
    const roles: RoleType[] = [RoleType.CUSTOMER];
    const allowed = checkUserRoleAccess(roles, [RoleType.CUSTOMER]);
    assert.equal(allowed, true);
  });

  it("should prevent CUSTOMER from accessing CATALOG_MANAGER endpoints", () => {
    const roles: RoleType[] = [RoleType.CUSTOMER];
    const allowed = checkUserRoleAccess(roles, [RoleType.CATALOG_MANAGER]);
    assert.equal(allowed, false);
  });

  it("should prevent CUSTOMER from accessing SUPER_ADMIN endpoints", () => {
    const roles: RoleType[] = [RoleType.CUSTOMER];
    const allowed = checkUserRoleAccess(roles, [RoleType.SUPER_ADMIN]);
    assert.equal(allowed, false);
  });

  it("should allow SUPER_ADMIN to access any protected resource", () => {
    const roles: RoleType[] = [RoleType.SUPER_ADMIN];
    assert.equal(checkUserRoleAccess(roles, [RoleType.CATALOG_MANAGER]), true);
    assert.equal(checkUserRoleAccess(roles, [RoleType.ORDER_MANAGER]), true);
    assert.equal(checkUserRoleAccess(roles, [RoleType.SUPPORT_AGENT]), true);
    assert.equal(checkUserRoleAccess(roles, [RoleType.CUSTOMER]), true);
  });

  it("should restrict CATALOG_MANAGER from order operations", () => {
    const roles: RoleType[] = [RoleType.CATALOG_MANAGER];
    const allowed = checkUserRoleAccess(roles, [RoleType.ORDER_MANAGER]);
    assert.equal(allowed, false);
  });
});

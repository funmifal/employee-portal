import { test } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import {
  canViewManuals,
  canUploadBatches,
  canEditDrafts,
  canPublishManuals,
  canManageUsers,
  maxRole,
} from "../lib/permissions/roles";

test("visible to all roles from VIEWER up", () => {
  assert.equal(canViewManuals(Role.VIEWER), true);
  assert.equal(canViewManuals(Role.EDITOR), true);
  assert.equal(canViewManuals(Role.ADMIN), true);
});

test("only EDITOR and above can upload or edit", () => {
  assert.equal(canUploadBatches(Role.VIEWER), false);
  assert.equal(canUploadBatches(Role.EDITOR), true);
  assert.equal(canUploadBatches(Role.ADMIN), true);
  assert.equal(canEditDrafts(Role.VIEWER), false);
  assert.equal(canEditDrafts(Role.EDITOR), true);
});

test("only ADMIN may publish or manage users", () => {
  assert.equal(canPublishManuals(Role.VIEWER), false);
  assert.equal(canPublishManuals(Role.EDITOR), false);
  assert.equal(canPublishManuals(Role.ADMIN), true);
  assert.equal(canManageUsers(Role.EDITOR), false);
  assert.equal(canManageUsers(Role.ADMIN), true);
});

test("maxRole picks the higher-rank role", () => {
  assert.equal(maxRole(Role.VIEWER, Role.EDITOR), Role.EDITOR);
  assert.equal(maxRole(Role.ADMIN, Role.EDITOR), Role.ADMIN);
});
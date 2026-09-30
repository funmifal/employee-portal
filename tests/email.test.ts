import { test } from "node:test";
import assert from "node:assert/strict";
import { sendEmailSchema, assertEmailSendPayload } from "../lib/email/validation";

test("send email schema accepts a valid payload", () => {
  const ok = sendEmailSchema.safeParse({
    to: "someone@example.com",
    subject: "Reminder",
    body: "Hello",
  });
  assert.equal(ok.success, true);
  if (ok.success) {
    assert.equal(ok.data.to, "someone@example.com");
    assert.equal(ok.data.body, "Hello");
  }
});

test("send email schema rejects empty subject and bad email", () => {
  assert.equal(sendEmailSchema.safeParse({ to: "not-an-email", subject: "Hi" }).success, false);
  assert.equal(sendEmailSchema.safeParse({ to: "a@b.com", subject: "  " }).success, false);
});

test("handler asserts required fields are present", () => {
  assert.throws(() => assertEmailSendPayload({ subject: "no to" }), /missing 'to'/);
  const parsed = assertEmailSendPayload({
    to: "a@b.com",
    subject: "Hi",
    body: "x",
    requestedBy: "user@x.com",
  });
  assert.equal(parsed.to, "a@b.com");
  assert.equal(parsed.requestedBy, "user@x.com");
});
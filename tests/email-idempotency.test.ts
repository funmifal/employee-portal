import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sendEmailIdempotently,
  JobOutputStore,
} from "../lib/email/idempotent-send";
import { EmailProvider, SendEmailInput } from "../lib/email/types";

class FakeProvider implements EmailProvider {
  readonly name = "fake";
  calls: SendEmailInput[] = [];
  private counter = 0;

  async send(input: SendEmailInput) {
    this.calls.push(input);
    this.counter += 1;
    return { id: `msg-${this.counter}` };
  }
}

class MemoryJobOutputStore implements JobOutputStore {
  rows = new Map<string, Record<string, unknown>>();

  async find(jobId: string) {
    return this.rows.get(jobId) ?? null;
  }

  async create(jobId: string, _type: string, payload: Record<string, unknown>) {
    const existing = this.rows.get(jobId);
    if (existing) {
      return { existed: true, payload: existing };
    }
    this.rows.set(jobId, payload);
    return { existed: false, payload };
  }
}

const baseInput = (): SendEmailInput => ({
  to: "a@example.com",
  subject: "Subject",
  body: "Body",
});

test("running the same job twice sends at most once", async () => {
  const provider = new FakeProvider();
  const store = new MemoryJobOutputStore();
  const jobId = "job-1";

  const first = await sendEmailIdempotently({
    jobId,
    input: baseInput(),
    provider,
    store,
  });
  const second = await sendEmailIdempotently({
    jobId,
    input: baseInput(),
    provider,
    store,
  });

  assert.equal(provider.calls.length, 1, "provider must be called exactly once");
  assert.equal(first.success, true);
  assert.equal(first.reused, false);
  assert.equal(second.success, true);
  assert.equal(second.reused, true);
  assert.deepEqual(second.output, first.output);
  assert.equal(store.rows.size, 1);
});

test("output is keyed by job id; distinct jobs each send", async () => {
  const provider = new FakeProvider();
  const store = new MemoryJobOutputStore();

  await sendEmailIdempotently({ jobId: "job-a", input: baseInput(), provider, store });
  await sendEmailIdempotently({ jobId: "job-b", input: baseInput(), provider, store });

  assert.equal(provider.calls.length, 2);
  assert.equal(store.rows.size, 2);
  assert.ok(store.rows.has("job-a"));
  assert.ok(store.rows.has("job-b"));
});

test("a second run keeps the first run's output even if it would fail again", async () => {
  // Simulates: first run succeeded and recorded output; the job is re-run
  // (crash before SUCCEEDED, or manual retry). The output must win over any
  // would-be failure so the second run returns the stored success.
  const provider = new FakeProvider();
  const store = new MemoryJobOutputStore();
  const jobId = "job-c";

  await sendEmailIdempotently({ jobId, input: baseInput(), provider, store });

  const second = await sendEmailIdempotently({ jobId, input: baseInput(), provider, store });

  assert.equal(provider.calls.length, 1);
  assert.equal(second.success, true);
  assert.equal(second.reused, true);
  assert.equal(second.output.messageId, "msg-1");
});

test("a provider failure records no output, so a retry re-attempts the work", async () => {
  const failingProvider: EmailProvider = {
    name: "flaky",
    async send() {
      throw new Error("provider down");
    },
  };
  const store = new MemoryJobOutputStore();

  const result = await sendEmailIdempotently({
    jobId: "job-d",
    input: baseInput(),
    provider: failingProvider,
    store,
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "provider down");
  assert.equal(store.rows.size, 0, "nothing recorded on failure");
});

test("the job's idempotency key is forwarded to the provider", async () => {
  const provider = new FakeProvider();
  const store = new MemoryJobOutputStore();

  await sendEmailIdempotently({
    jobId: "job-e",
    input: { ...baseInput(), idempotencyKey: "email-send:abc123" },
    provider,
    store,
  });

  assert.equal(provider.calls[0].idempotencyKey, "email-send:abc123");
});

test("a concurrent duplicate create collapses into one recorded output", async () => {
  const provider = new FakeProvider();
  // Store where every create behaves as if another worker already recorded it.
  const racingStore: JobOutputStore = {
    async find() {
      return null;
    },
    async create(jobId, _type, payload) {
      return { existed: true, payload: { ...payload, messageId: "msg-existing" } };
    },
  };

  const result = await sendEmailIdempotently({
    jobId: "job-f",
    input: baseInput(),
    provider,
    store: racingStore,
  });

  assert.equal(result.success, true);
  assert.equal(result.reused, true);
  assert.equal(result.output.messageId, "msg-existing");
});
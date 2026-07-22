import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { requestAllowed, requireJson, readBody } = require("../httpUtils.cjs");

assert.equal(requestAllowed({ headers: {} }, new Set()), true);
assert.equal(requestAllowed({ headers: { origin: "http://allowed.test" } }, new Set(["http://allowed.test"])), true);
assert.equal(requestAllowed({ headers: { origin: "http://blocked.test" } }, new Set(["http://allowed.test"])), false);
assert.equal(requireJson({ headers: { "content-type": "application/json; charset=utf-8" } }), true);
assert.equal(requireJson({ headers: { "content-type": "text/plain" } }), false);

class FakeReq extends EventEmitter {
  destroy() {
    this.destroyed = true;
  }
}

const req = new FakeReq();
const bodyPromise = readBody(req, 20);
req.emit("data", "hello");
req.emit("end");
assert.equal(await bodyPromise, "hello");

const largeReq = new FakeReq();
const largePromise = readBody(largeReq, 3);
largeReq.emit("data", "toolarge");
await assert.rejects(largePromise, /Request body too large/);
assert.equal(largeReq.destroyed, true);

console.log(JSON.stringify({ ok: true, checked: ["origin guard", "json content type", "body size limit"] }, null, 2));

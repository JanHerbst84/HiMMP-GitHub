import assert from "node:assert/strict";
import { validateEquivalenceReplacement } from "./lib/d1-equivalence.mjs";

const equivalence = {
  replacementDecl: { property: "padding", value: "clamp(36px, 6vh, 72px) 0" }
};

assert.equal(
  validateEquivalenceReplacement(
    equivalence,
    new Map([["padding", { value: "clamp(36px, 6vh, 72px) 0", sourceFile: "fixture.css" }]])
  ),
  null
);

assert.deepEqual(
  validateEquivalenceReplacement(equivalence, new Map()),
  {
    kind: "missing-equivalence-replacement",
    property: "padding",
    expectedValue: "clamp(36px, 6vh, 72px) 0"
  }
);

assert.deepEqual(
  validateEquivalenceReplacement(
    equivalence,
    new Map([["padding", { value: "0", sourceFile: "fixture.css" }]])
  ),
  {
    kind: "wrong-equivalence-replacement",
    property: "padding",
    expectedValue: "clamp(36px, 6vh, 72px) 0",
    actualValue: "0",
    actualSource: "fixture.css"
  }
);

assert.deepEqual(
  validateEquivalenceReplacement({ replacementDecl: {} }, new Map()),
  { kind: "invalid-equivalence" }
);

console.log("D-1 equivalence enforcement regression tests passed.");

function normalizeValue(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function validateEquivalenceReplacement(equivalence, presentProps) {
  const replacement = equivalence?.replacementDecl;
  if (!replacement?.property || typeof replacement.value !== "string") {
    return { kind: "invalid-equivalence" };
  }

  const present = presentProps.get(replacement.property);
  if (!present) {
    return {
      kind: "missing-equivalence-replacement",
      property: replacement.property,
      expectedValue: replacement.value
    };
  }

  if (normalizeValue(present.value) !== normalizeValue(replacement.value)) {
    return {
      kind: "wrong-equivalence-replacement",
      property: replacement.property,
      expectedValue: replacement.value,
      actualValue: present.value,
      actualSource: present.sourceFile
    };
  }

  return null;
}

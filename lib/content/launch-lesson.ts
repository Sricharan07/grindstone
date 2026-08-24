export const launchLesson = {
  id: "mutability-references",
  title: "Mutability: references are not copies",
  topic: "Python foundations",
  duration: 14,
  code: [
    "scores = [72, 81]",
    "backup = scores",
    "scores.append(94)",
    "print(backup)",
  ],
  trace: [
    { line: 1, output: "", explanation: "A list object is allocated and scores points to it.", variables: [{ name: "scores", value: "list @A", reference: "A" }], heap: [{ id: "A", value: "[72, 81]" }] },
    { line: 2, output: "", explanation: "backup receives the same reference. No list is copied.", variables: [{ name: "scores", value: "list @A", reference: "A" }, { name: "backup", value: "list @A", reference: "A" }], heap: [{ id: "A", value: "[72, 81]" }] },
    { line: 3, output: "", explanation: "append mutates the single list object at A.", variables: [{ name: "scores", value: "list @A", reference: "A" }, { name: "backup", value: "list @A", reference: "A" }], heap: [{ id: "A", value: "[72, 81, 94]" }] },
    { line: 4, output: "[72, 81, 94]", explanation: "backup sees the mutation because both names point to A.", variables: [{ name: "scores", value: "list @A", reference: "A" }, { name: "backup", value: "list @A", reference: "A" }], heap: [{ id: "A", value: "[72, 81, 94]" }] },
  ],
};

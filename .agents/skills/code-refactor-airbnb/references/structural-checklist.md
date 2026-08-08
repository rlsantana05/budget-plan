# Structural Review Checklist

Judgment-level patterns ESLint doesn't (and largely can't) check. Read this fresh each session — don't rely on having internalized it from a prior run, since correctness here depends on the actual code, not a memorized rule.

For every item below: decide low-risk vs. needs-confirmation using the code in front of you, not the label alone. The same pattern can be either, depending on context.

---

## 1. Hook stability (dependency arrays, callback identity)

**Check:** Do `useCallback`/`useMemo` dependency arrays list everything the function actually reads? Are handlers passed to memoized children wrapped in `useCallback`, or redefined inline every render (defeating the child's `memo`)?

**Low-risk:** Adding a missing-but-genuinely-static dependency (e.g. a ref, a value from `useState` setter that's already stable). Wrapping an inline arrow function in `useCallback` when it's passed as a prop to a `memo`'d child and has no behavior change.

**Needs confirmation:** Removing a dependency (even if it "looks" unnecessary) — this can silently reintroduce stale-closure bugs. Changing what a `useEffect` depends on, since that changes _when_ it fires, which is a behavior change even if it looks like a cleanup.

**Example seen in practice:** A drag handler read `group.items` directly instead of a ref, forcing the dependency array to include it — recreating the callback (and defeating child memoization) on every reorder tick. Fix was to introduce a `latestOrderRef` synced via `useEffect`, keeping the callback's deps empty. This is a needs-confirmation change: it introduces a new ref and changes how the callback gets its data, even though the net behavior is identical.

---

## 2. Memoization boundaries

**Check:** Is `React.memo` applied where a component re-renders expensively and receives stable props? Are `useMemo`d values actually expensive to recompute, or is the memoization overhead not worth it?

**Low-risk:** Removing a `useMemo` around a trivial computation (e.g. a single arithmetic expression) — memoizing cheap work can cost more than it saves.

**Needs confirmation:** Adding or removing `React.memo` on a component — this changes re-render behavior across the whole subtree, and "is this component expensive enough to matter" is a judgment call, not a fact you can verify by reading the file alone.

---

## 3. Ref vs. state architecture

**Check:** Is a value stored in a ref when it should trigger a re-render (bug), or in state when a ref would avoid unnecessary re-renders (perf)?

**Low-risk:** None — by nature, changing where a value lives changes render timing. Always needs-confirmation.

**Needs confirmation:** Always. Flag with a concrete explanation of what would visually/behaviorally change if the value moved from ref to state or vice versa.

**Example seen in practice:** A component correctly kept `draggingIdRef` (for synchronous reads inside frame-by-frame drag handlers) alongside a separate `draggingItemId` state (purely to trigger the re-render that applies drag styling). Collapsing these into one would either lose the dragging visual style or reintroduce stale-closure risk in the drag math — a real trade-off, not a cleanup.

---

## 4. Component size and splitting

**Check:** Does a single component file mix more than ~2-3 distinct responsibilities (e.g. data fetching + form state + presentational JSX + drag math)? Rough guideline: a component file consistently over ~150-200 lines is worth examining for a split, but line count alone is not sufficient justification — check for actual responsibility mixing.

**Low-risk:** Extracting a clearly self-contained, stateless piece of JSX into its own presentational component in the same file/folder, with no prop contract changes.

**Needs confirmation:** Splitting stateful logic into a custom hook, or moving a component to a new file/folder — this changes the module boundary and import paths across the codebase, and file/folder layout is often a deliberate project convention, not something to infer unilaterally.

---

## 5. Duplication

**Check:** Is the same JSX structure, validation logic, or formatting function repeated across files in scope?

**Low-risk:** Extracting duplicated _pure_ utility functions (formatters, validators with no side effects) into a shared `utils` file, preserving exact behavior.

**Needs confirmation:** Extracting duplicated _stateful_ logic into a shared hook — verify the duplicated instances aren't subtly different for a reason (e.g. one intentionally omits a field) before merging them.

---

## 6. Naming and prop drilling

**Check:** Do variable/prop names accurately describe what they hold? Is a prop passed through 3+ component layers untouched (candidate for context or restructuring)?

**Low-risk:** Renaming a clearly mismatched local variable (e.g. `data` that only ever holds a `Group[]`) within a single file, where the rename doesn't cross a prop/export boundary.

**Needs confirmation:** Renaming anything that's part of a component's public prop interface, or introducing context/composition to solve prop drilling — this is an architecture decision with multiple valid answers depending on how much the codebase expects to grow.

---

## 7. Dead code and unused exports

**Check:** Functions, variables, or exports that are defined but never referenced anywhere in scope (or, if checkable, anywhere in the repo).

**Low-risk:** Removing dead code local to the file in scope, confirmed unused within that file.

**Needs confirmation:** Removing an _exported_ function/component even if it appears unused in scope — it may be consumed elsewhere outside the current folder. Search the wider repo before flagging this as low-risk; if a repo-wide search isn't feasible in scope, default to needs-confirmation rather than assuming safety.

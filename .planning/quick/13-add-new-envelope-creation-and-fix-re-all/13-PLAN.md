---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/envelopes/EnvelopesHomePage.tsx
  - src/components/envelopes/DonorAllocationRow.tsx
autonomous: true
requirements: [QUICK-13]
must_haves:
  truths:
    - "User can create a new envelope without entering edit mode first"
    - "Create Envelope card appears after existing envelope cards when not in edit mode"
    - "DonorAllocationRow amount input accepts free-form typing without cursor jumping or value reformatting"
    - "Allocation amount correctly converts to cents on change"
  artifacts:
    - path: "src/components/envelopes/EnvelopesHomePage.tsx"
      provides: "Always-visible CreateEnvelopeCard + inline EnvelopeForm"
    - path: "src/components/envelopes/DonorAllocationRow.tsx"
      provides: "Raw string state for allocation amount input"
  key_links:
    - from: "src/components/envelopes/EnvelopesHomePage.tsx"
      to: "CreateEnvelopeCard"
      via: "Rendered outside isEditing guard"
      pattern: "CreateEnvelopeCard"
    - from: "src/components/envelopes/DonorAllocationRow.tsx"
      to: "onAllocationChange"
      via: "parseFloat on raw string, converted to cents"
      pattern: "onAllocationChange.*Math\\.round"
---

<objective>
Two focused fixes for the Envelopes app:

1. Make the "Add Envelope" creation flow accessible from the main view (not just edit mode)
2. Fix the DonorAllocationRow amount input that reformats on every keystroke due to .toFixed(2) on the controlled value

Purpose: Improve core UX -- creating envelopes should be frictionless, and entering allocation amounts should work naturally.
Output: Updated EnvelopesHomePage.tsx and DonorAllocationRow.tsx
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/envelopes/EnvelopesHomePage.tsx
@src/components/envelopes/DonorAllocationRow.tsx
@src/components/envelopes/CreateEnvelopeCard.tsx
@src/components/envelopes/EnvelopeForm.tsx
@src/components/envelopes/OverageModal.tsx
@src/components/ui/Card.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Show CreateEnvelopeCard and inline create form outside edit mode</name>
  <files>src/components/envelopes/EnvelopesHomePage.tsx</files>
  <action>
Currently the CreateEnvelopeCard and EnvelopeForm for creation are only rendered inside an `{!isReadOnly && isEditing && (...)}` guard (lines 453-481). This forces users to click "Edit Envelopes" before they can add a new envelope.

Fix: Add a second rendering of the create flow AFTER the EnvelopeCardGrid, visible when NOT in edit mode and NOT readonly. Specifically:

1. After the closing `</EnvelopeCardGrid>` tag (line 482), add a new section that renders ONLY when `!isReadOnly && !isEditing`:
   - If `isCreating` is true, show a Card containing the EnvelopeForm in create mode (same pattern as the edit-mode version on lines 470-478)
   - If `isCreating` is false, show the CreateEnvelopeCard with `onClick={() => setIsCreating(true)}`
   - Wrap in a container div with `className="mt-4"` for spacing

2. Also ensure `isCreating` state is reset when entering edit mode. In the "Edit Envelopes" button onClick handler (line 335-340), add `setIsCreating(false)` alongside the existing state resets.

3. Keep the existing edit-mode create flow (lines 453-481) as-is so creation also works in edit mode.

Do NOT remove the isProfileMissing check -- the new non-edit-mode section should also check `isProfileMissing` and show the "Set Up Budget" prompt if profile is missing (same pattern as lines 456-469).
  </action>
  <verify>Run `npm run lint && npm run build` -- zero errors. Visually confirm in the component that CreateEnvelopeCard renders both inside and outside the edit mode guard.</verify>
  <done>CreateEnvelopeCard is visible on the main envelopes page without clicking "Edit Envelopes". The create form appears inline when the card is clicked. Existing edit-mode creation still works.</done>
</task>

<task type="auto">
  <name>Task 2: Fix DonorAllocationRow amount input to use raw string state</name>
  <files>src/components/envelopes/DonorAllocationRow.tsx</files>
  <action>
The current `displayValue` (line 21-22) uses `.toFixed(2)` which reformats the value on every render, causing cursor jumping and making it impossible to type naturally (e.g., typing "5" immediately shows "5.00").

Fix by changing DonorAllocationRow to use a local raw string state pattern (same approach used in EnvelopeForm and IncomeAllocationModal):

1. Add a `useState<string>` for the raw input value. Initialize it from `allocationCents`:
   - If `allocationCents > 0`, initialize to `(allocationCents / 100).toFixed(2)`
   - If `allocationCents === 0`, initialize to `""`

2. Add a `useEffect` that syncs the local string state when `allocationCents` changes FROM OUTSIDE (e.g., when the modal resets). Use the allocationCents prop as the dependency. Only update if the current parsed value differs from the prop to avoid overwriting during typing:
   ```
   const currentParsed = Math.round(Number.parseFloat(localValue || "0") * 100);
   if (currentParsed !== allocationCents) {
     setLocalValue(allocationCents > 0 ? (allocationCents / 100).toFixed(2) : "");
   }
   ```

3. In `handleChange`, update the local string state directly from `e.target.value` AND call `onAllocationChange` with the converted cents value (existing logic).

4. Use the local string state as the input's `value` instead of `displayValue`.

5. Remove the old `displayValue` computation.

Import `useState` and `useEffect` from React (useState may already be used if component has other state -- it doesn't currently, so add the import).
  </action>
  <verify>Run `npm run lint && npm run build` -- zero errors. Verify the input value prop uses the local string state, not a .toFixed(2) computed value.</verify>
  <done>DonorAllocationRow amount input allows natural typing without cursor jumps or reformatting. Empty input shows placeholder "0.00". Clearing input sets allocation to 0 cents. Typed values propagate correctly to parent via onAllocationChange.</done>
</task>

</tasks>

<verification>
1. `npm run lint` passes with zero errors
2. `npm run build` passes with zero errors
3. `npm test` passes (if envelope-related tests exist)
4. EnvelopesHomePage renders CreateEnvelopeCard outside edit mode
5. DonorAllocationRow input uses raw string state, not .toFixed(2) display value
</verification>

<success_criteria>
- Users can create envelopes from the main view without entering edit mode
- Allocation amount inputs accept natural typing (no cursor jumps, no forced formatting)
- All quality gates pass (lint, build, test)
</success_criteria>

<output>
After completion, create `.planning/quick/13-add-new-envelope-creation-and-fix-re-all/13-SUMMARY.md`
</output>

# Task: admin-panel-ui.T10

**Implements:** `admin-panel-ui.T10` — Create User form's Manager field becomes a selector of available Managers.

**Acceptance:** `admin-panel-ui.AC5` (directly — no new AC needed; a usable create-user action implies a usable way to supply the `managerId` field `user-management-console.API01` already requires for `role: "Employee"`).

**Origin:** explicit user request — "While adding an employee, the manager field should be a list of available managers to choose from." Currently it's a free-text input where the Admin has to type a raw Manager `id` string by hand.

**Scope — build only this:**
- In `UserManagement.tsx`'s Create User form, replace the Manager `Field id="managerId" name="managerId" as={Input}` (shown only when `values.role === "Employee"`) with a `<select>` populated from `data` — the same list `useUsers()` already fetched for the table below — filtered to `role === "Manager"`. No new hook, service, or endpoint call; `data` is already in scope in this component.
- Each option's value is the Manager's `id`; its label is the Manager's `username` (there's no display-name field anywhere in this project — `username` is the only identifying field `UserListItem` has).
- Keep the existing Yup rule unchanged (`managerId` required when `role === "Employee"`) — it already validates correctly against a `<select>`'s value the same way it did against free text.

**Do not touch:**
- The Edit form (role-only, per this task's own already-settled scope from `T06`) — Manager is not editable there and this task doesn't change that.
- `usersService.ts`, `useUsers.ts`, or any other hook/service — no new data source is needed.
- Any other field in the Create form.

**Test-first:** Do not write this task's implementation until `@generate-tests.md for admin-panel-ui.T10` has produced Red tests for it, confirmed failing for the right reason. At minimum: with at least one Manager in the fetched user list, selecting Employee as the role shows a Manager `<select>` listing that Manager by username; choosing one and submitting sends that Manager's `id` as `managerId` in the create payload; with no Manager in the list, the field still renders (empty selector) and required-field validation still blocks submission. Existing tests that exercised the old free-text field (`user.type(...)` on the Manager field) will need updating to `user.selectOptions(...)` against a mocked user list that includes a Manager — update them deliberately, not left silently broken.

# INT React Frontend Engineering Standards

You are assisting an engineering team at INT. Whenever you write, refactor, or suggest React frontend code, you must strictly adhere to the following rules:

## 1. Tech Stack

- Next.js (App Router)
- React (Functional Components)
- TypeScript (Strict Mode)
- Tailwind CSS + shadcn/ui
- Zustand (Client State)
- TanStack Query (Server State)
- MongoDB (sole datastore) + Mongoose (ODM) — schema validation via Mongoose schemas / $jsonSchema, since MongoDB has no native check-constraint equivalent; this is the project's only approved database, per constitution.md
- REST
- Jest + React Testing Library

## 2. Project Structure

```
your-react-app/
├── .ai-context/
│   ├── constitution.md
│   ├── project_context.md
│   ├── architecture.md
│   ├── BRD.md
│   ├── status.md
│   ├── prompt_history.md
│   │
│   ├── decisions/
│   ├── specs/
│   │   └── README.md
│   │
│   ├── plans/
│   │   └── README.md
│   │
│   ├── tasks/
│   │   └── README.md
│   │
│   └── test_cases/
│       └── README.md
│
├── .agent/
│   ├── rules/
│   │   ├── int-standards.react.md
│   │   ├── code-style.md
│   │   └── .agentignore
│   │
│   └── workflows/
│       ├── generate-spec.md
│       ├── generate-plan.md
│       ├── generate-tasks.md
│       ├── generate-tests.md
│       └── code-review.md
│
├── src/
│   ├── modules/
│   ├── shared/
│   ├── services/
│   └── store/
├── tests/
└── README.md
```

## 3. Architecture Principles

### 3.1 Feature-Based Structure

- Organize the `src/` directory by functional features rather than technical types.
- Keep each feature isolated under `modules/` directory.
- Shared logic/components under `shared/`.

### 3.2 Data Flow

```
UI Layer (Components)
↓
Hooks Layer (Business Logic)
↓
State Layer (Local / Global / Server)
↓
Service Layer (API Calls)
↓
Backend (MongoDB via Mongoose)
```

### 3.3 State Management Strategy

- Use **TanStack Query (React Query)** for all API-side data.
- Use **Zustand** for lightweight, high-performance global state. Avoid Redux unless specified.
- Use `useState` for UI-only toggles. Use `useReducer` for complex local transitions.

## 4. Coding Standards

### 4.1 General Rules

- Use TypeScript ES6+ syntax consistently.
- Prefer `const` over `let`; avoid `var`.
- Always use async/await for asynchronous operations. Do not use raw Promises (.then().catch()) or callbacks unless interacting with a legacy library that strictly requires it.
- Keep functions small and modular. A single function should do one thing well.
- Use descriptive variable and function names. Avoid single-letter variables except in standard loops (like i, j).

### 4.2 Components

- Use functional components with arrow functions and TypeScript interfaces for props. Strictly no Class components.
- Use this pattern for complex UI (e.g., `Tabs`, `Modals`, `Wizards`) to provide a declarative API.
- Prefer logic-only hooks or headless libraries (Radix, HeadlessUI) to decouple behavior from styling.
- Keep components focused and small. Extract reusable UI and logic into separate modules when complexity grows.

### 4.3 Hooks

- Abstract all complex stateful behavior, data fetching, or event listeners into custom hooks (e.g., `useAIPrompt`).
- Keep `useEffect` blocks small. Every effect **must** have a complete dependency array.
- Use `useMemo` and `useCallback` only for expensive computations or to prevent unnecessary re-renders in optimized sub-trees.

### 4.4 TypeScript

- Enforce Type Safety by avoiding `any` and enabling strict compiler checks. This transforms runtime errors into compile-time feedback, providing a "self-documenting" codebase that catches bugs before they reach production.
- Define strict interfaces for API responses. Use Zod for runtime schema validation to ensure the AI's JSON output matches what your UI expects.
- Use Interfaces for defining object shapes and supporting inheritance, and Types for unions, intersections, or primitives. Proper usage ensures your data structures are predictable, extensible, and easy for other developers to navigate.
- Use Discriminated Unions for handling different UI states (e.g., loading, error, streaming, success).

## 5. Data Fetching Standards

### TanStack Query

- Use React Query (TanStack Query) for all server data fetching.
- Do not fetch data directly inside components.
- Avoid `useEffect` for API calls.
- Wrap all queries and mutations inside custom hooks.
- Keep API logic inside the service layer.
- Use structured and consistent query keys.
- Cache and reuse server data; avoid duplicate API calls.
- Invalidate or update queries after mutations.
- Keep server state separate from client/global state.
- Handle loading and error states at the hook level.
- Transform API data inside hooks, not components.
- Implement retry strategies.

### Database Layer (MongoDB)

- All schema definitions live behind Mongoose models — no route handler builds a raw query object from unsanitized user input directly.
- Data-integrity rules that would be a database check-constraint in a relational system (e.g., "field X is only valid when field Y equals Z") are enforced via Mongoose schema validators or `$jsonSchema` — document this explicitly in the relevant plan.md, since it is an application-layer guarantee, not a database-engine-enforced one.
- Treat MongoDB query operators (`$where`, `$gt`, `$ne`, etc.) arriving from client input as untrusted — never pass a client-supplied object directly into a query filter without validating its shape first (NoSQL injection).

## 6. State Management and Data Flow

- Use `useState` / `useReducer` for Local UI.
- For server data use React Query.
- Use Zustand for global state management.
- For URL use Router params.
- Use for global UI/auth state.
- Avoid unnecessary global state.
- Keep store minimal and modular.

## 7. Error Handling

- Handle loading, empty, and error states for all async UI flows.
- Isolate crashes to specific components to prevent the entire app from going white.
- Catch network errors proactively to keep the application state predictable and interactive.
- Replace broken UI with clear messages or "try again" buttons to maintain user trust.
- Never silently swallow errors. Log technical details through the project logger or maintain an error log.
- Add guard clauses to prevent null/undefined render failures.

## 8. Anti-Patterns

- Overusing useEffect
- Prop drilling
- Large monolithic components
- Overuse of global state
- Mixing UI & business logic
- Passing raw client input into a MongoDB query filter unvalidated

## 9. Security Guidelines

- Never hardcode secrets, private keys, or tokens in frontend code. Use env variable instead.
- Treat all client input and query params as untrusted.
- Prevent XSS by avoiding unsafe HTML rendering unless sanitized and approved.
- Do not persist sensitive data in localStorage/sessionStorage unless explicitly approved.
- Sanitize/whitelist any field names or operators before they reach a MongoDB query — never spread a raw client object into a `find()`/`update()` filter.

## 10. Rendering & Performance Optimization

- Skip re-renders for functional components when their props haven't changed.
- Avoid unnecessary re-renders by memoizing expensive calculations and stable callbacks where needed using `useMemo` & `useCallback`.
- Code split route-level features and heavy modules.
- Load components on-demand to shrink initial bundle size and speed up page loads (Lazy loading).
- Optimize large lists using pagination or virtualization.
- Fetch heavy libraries only when needed to save bandwidth and execution time.
- Use SSR (Server Side Rendering) logic to ship zero JavaScript for static or data-heavy UI.

## 11. Form Handling

- Use Formik + Yup.
- Centralize validation.
- Support dynamic forms.

## 12. Testing Strategy

- Use Jest + React Testing Library
- Cover:
  - UI rendering
  - User interaction
  - API states
  - Mongoose schema validation rules (e.g., a check-constraint-equivalent rule is actually enforced)

## 13. Accessibility and Quality

- Use semantic HTML and keyboard-accessible interactions.
- Ensure interactive controls have accessible labels and visible focus states.
- Maintain unit/integration tests for critical UI paths.

## 14. AI Agent Structure

### .agent/

- rules → coding standards
- workflows → reusable prompts

### .ai-context

- project context
- architecture
- test cases
- prompt history

## 15. Code Review Guidelines

Review code for:

- Security issues
- Performance problems
- Error handling
- Maintainability
- Accessibility

## 16. Test Generation Guidelines

- Cover happy path, edge cases, failures.
- Mock external dependencies.
- Use clear assertions.

## 17. AI Usage Policy

- Make sure AI is used internally only.
- Do not expose AI artifacts to client.
- Remove **.agent/** and **.ai-context/** before client delivery.

## 18. CI/CD & Sanitization Strategy

### Dual Repo Setup

- Internal Repo → full AI setup
- Client Repo → clean code only

### Pipeline Actions

- Remove AI folders.
- Clean commit history.
- Standardize commits.

## 19. Token Optimization Guidelines

- Limit context usage.
- Avoid long chat history.
- Use correct model for task.
- Break tasks into smaller steps.

## 20. Developer Best Practices

- Write reusable components.
- Follow DRY principle.
- Maintain clean folder structure.
- Use workflows instead of repetitive prompts.

## 21. Business Requirements Document (BRD)

The BRD defines the functional and business expectations of the application. This should be maintained separately under **.ai-context/BRD.md** but is summarized here for developer understanding.

### Key Sections of BRD

- **User Roles:** Admin, Seller, Customer
- **Core Features:**
  - Authentication & Authorization (RBAC)
  - Dashboard & Analytics
  - Inventory/Product Management
  - Order & Transaction Management
- **User Stories:**
  - As an Admin, I can manage users and permissions
  - As a Seller, I can manage inventory and view orders
  - As a Customer, I can browse and purchase products

### Guidelines

- Always align implementation with BRD requirements.
- Do not implement features without defined user stories.
- Update BRD when new features are introduced.

## 22. Guardrails

- Source of Truth: Use this Markdown file as a context provider for AI coding assistants.
- Scaffolding: When asking AI to generate code, reference this file to ensure the output matches our feature-based structure and discipline.
- Never include comments indicating that code was generated by AI.
- Never write commit messages that hint code was AI-generated.
- Do not add AI-specific configuration files (such as `.cursorrules` or `.copilotignore`) outside `.agent/`.

## 23. Conclusion

This architecture ensures:

- Scalability
- Maintainability
- AI-assisted productivity
- Clean separation between internal and client-facing code

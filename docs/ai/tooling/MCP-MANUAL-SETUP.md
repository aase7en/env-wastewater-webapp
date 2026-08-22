# MCP Manual Setup and Verification

Last updated: 2026-08-22

This guide covers only the steps that require the user's UI/OAuth approval. The Codex config for Context7, Playwright MCP, and Chrome DevTools MCP was already prepared automatically; see `AI-DEVELOPER-TOOLCHAIN.md`.

## A. Verify the three MCP servers already configured for Codex

1. Close and reopen Codex so it reloads the user MCP configuration.
2. Open Codex Settings.
3. Open the MCP servers / tools section.
4. Confirm these names appear and can start:
   - `context7`
   - `playwright`
   - `chrome_devtools`
5. If Codex asks permission to download/start an `npx` package, approve only the package names listed above.
6. Run small verification prompts:
   - Context7: `Use Context7 to show the current React Three Fiber Canvas gl prop documentation.`
   - Playwright: `Open the local app and inspect the page accessibility tree without changing data.`
   - Chrome DevTools: `Open an isolated browser page and report console errors only.`

If any server fails, do not remove the old Codex config. A timestamped pre-change backup exists in the user's `.codex` directory.

## B. Figma remote MCP / Codex plugin

Figma recommends its remote MCP/plugin for Codex.

User action required because OAuth must be approved by the Figma account owner.

1. Open Codex.
2. In the upper-left, open **Plugins**.
3. Click `+` next to **Figma**.
4. Click **Install Figma**.
5. A Figma/ChatGPT authorization window opens.
6. Review the requested permissions.
7. Click **Allow access** only if the account/file access is appropriate.
8. Return to Codex and verify Figma tools are listed.
9. Start with a non-sensitive design file or frame URL.

Policy:

- use Figma for design context/components/layout;
- do not place hospital production data, API keys, credentials, or patient data in design files merely to give an agent context;
- current Figma MCP access is beta and pricing/usage policy may change later.

## C. Supabase MCP

Do **not** connect the production Supabase project by default. Supabase's own MCP security guidance says the MCP is intended for development/testing and warns about LLM/prompt-injection risks.

Recommended first setup: a development/staging project or an intentionally sanitized project.

1. Open Supabase's official MCP configuration page.
2. Choose **Hosted**.
3. Select the development/staging UTH[AI]-ENV project.
4. Enable **Read-only**.
5. Scope the server with `project_ref=<development-project-ref>`.
6. Initially enable only the minimum feature groups needed, e.g. `database,docs,debugging`.
7. Add the generated Streamable HTTP server to Codex/your chosen MCP client.
8. Start/authenticate the server.
9. A browser OAuth page opens. Review the organization/project access and approve only the intended account.
10. Test with read-only actions first:
    - list tables;
    - read migrations;
    - read advisors/logs;
    - do not run mutation/migration tools during initial validation.

A safe URL shape is conceptually:

```text
https://mcp.supabase.com/mcp?project_ref=<DEV_PROJECT_REF>&read_only=true&features=database,docs,debugging
```

Do not put a Supabase PAT in this repository.

## D. GISTDA API credential placement

The user already has GISTDA API access. Do not paste the key into chat and do not add it to frontend `VITE_*` variables.

For the first endpoint-inventory work order:

1. Keep the key in a local password manager or secure note for now.
2. When an Edge Function proof of concept is approved, store the key as a Supabase server-side secret (exact secret name to be defined in that work order).
3. The browser calls our server-side proxy/Edge Function, never GISTDA directly with a private key.
4. Capture only sanitized sample responses in tests/docs.

## E. Storybook MCP

No user action yet.

The repository currently uses Ladle. Storybook MCP would require adding Storybook/addon dependencies. That is intentionally deferred until a component-workbench adoption work order confirms the benefit outweighs duplication.

## F. Community 3D MCPs

Do not install Blender/Three.js community MCPs automatically.

Before installation:

1. review repository ownership/activity;
2. inspect permissions and local code execution behavior;
3. pin a version/commit where practical;
4. run in an isolated project/profile;
5. never grant access to unrelated local directories or credentials.

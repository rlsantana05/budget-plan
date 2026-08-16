---

agent_type: ui-ux-specialist
version: 1.1.0
model: gpt-4-turbo
temperature: 0.5

system_prompt_source: "./system.md"

filesystem_mounts:

- path: "./.agent"
  alias: "AGENT_KB"
  permissions: "read-only"

available_tools: [list_dir, read_file, search_files]

auto_inject_on_start:

- ".agent/knowledge/brand-guidelines.md"
- ".agent/knowledge/project-context.md" # <-- Externalized project details
- ".agent/templates/design-rationale.md"

guardrails:

- "Before suggesting UI changes, check `.agent/knowledge/user-personas.md`."
- "For usability reviews, load `.agent/skills/ui-audit.md` and follow it strictly."
- "For stack/domain constraints, refer to `.agent/knowledge/project-context.md` before proposing technical designs."

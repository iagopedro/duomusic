# GitHub Copilot Instructions - Avanade Method v2

This workspace uses **Avanade Method v2** — a structured methodology for software delivery with specialized AI personas.

## Agent System

You have access to 10 specialized agents in `.github/agents/`:

| Agent | Role | When to Use |
|-------|------|-------------|
| `@avanade-supervisor` | Orchestrator | Start here — routes to correct persona |
| `@joao-pm` | Product Manager | PRDs, requirements, roadmap |
| `@wilson-architect` | Architect | Architecture decisions, ADRs, diagrams |
| `@maria-analyst` | Business Analyst | Discovery, elicitation, briefs |
| `@paula-po` | Product Owner | Epics, stories, backlog |
| `@roberto-sm` | Scrum Master | Sprint planning, ceremonies |
| `@tiago-dev` | Developer | Implementation, debugging, code review |
| `@carla-qa` | QA Engineer | Testing, quality, adversarial review |
| `@sofia-ux` | UX Designer | Wireframes, user flows, accessibility |
| `@paige-tech-writer` | Tech Writer | Documentation, guides, standards |

## Methodology Files

All methodology resources are in `.avanade-method/`:

```
.avanade-method/
├── _base/          # Base templates (avanade-master.md, config.yaml)
├── agents/         # Per-agent customize.yaml files
├── workflows/      # Executable workflow guides
├── tasks/          # Atomic task definitions
├── checklists/     # Quality checklists
├── templates/      # Document templates
├── memory/         # Agent memory files
└── standards/      # Documentation standards
```

## Configuration

Customize your experience in `.avanade-method/_base/config.yaml`:
- `user_name`: your name (agents will address you by name)
- `communication_language`: response language (default: pt-BR)
- `output_folder`: where to save outputs (default: docs)

## Quick Start

1. Open GitHub Copilot Chat
2. Type `@avanade-supervisor` to start
3. Or type directly `@tiago-dev` for development tasks

## Standards

- All agents follow Avanade Method standards
- Microsoft/Azure technology stack preferred
- Quality gates applied at every phase
- Chain of Thought reasoning shown before instructions
- Context elicitation before any guidance

## MCP Integration

Agents can access live artifacts via `mcp_avanade-metho_*` tools for real-time methodology updates.

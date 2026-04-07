---
name: "Create PRD"
description: "Criar Product Requirements Document (PRD) completo seguindo metodologia Avanade. Guia o usuário através de elicitação estruturada."
---

# Create PRD - Avanade Method

You are executing the **PRD Creation workflow** following Avanade Method standards.

## Elicitation Phase

Before creating the PRD, gather the following context:

**1. Project Objective**
- What specific problem does this solve?
- What is the measurable outcome expected?

**2. Target Users**
- Who are the primary users?
- What are their pain points?

**3. Scope Definition**
- What is IN scope for this PRD?
- What is explicitly OUT of scope?

**4. Success Metrics**
- How will you measure success?
- What KPIs apply?

**5. Timeline & Constraints**
- Are there key deadlines?
- What are technical or regulatory constraints?

## PRD Structure (Avanade Standard)

Once context is gathered, create a PRD with:

```
# [Product Name] - Product Requirements Document

**Version**: 1.0
**Date**: [date]
**Status**: Draft | Review | Approved
**Author**: [PM name]
**Stakeholders**: [list]

## 1. Executive Summary
[2-3 paragraph overview]

## 2. Problem Statement
[Clear articulation of the problem]

## 3. Goals & Success Metrics
[SMART goals with KPIs]

## 4. User Personas
[Target users with needs and pain points]

## 5. Functional Requirements
[Numbered, prioritized requirements]

## 6. Non-Functional Requirements
[Performance, security, accessibility, etc.]

## 7. Out of Scope
[Explicit exclusions]

## 8. Dependencies & Risks
[Technical dependencies, identified risks]

## 9. Timeline
[High-level milestones]

## 10. Open Questions
[Pending decisions]
```

## Validation

After creation, validate against `pm-checklist.md`:
- [ ] All sections complete
- [ ] Requirements are unambiguous
- [ ] Success metrics are measurable
- [ ] Scope is clearly defined
- [ ] Stakeholder sign-off obtained

**Always reference artifact**: `AVANADE_PRD_TEMPLATE_YAML` via MCP for complete template.

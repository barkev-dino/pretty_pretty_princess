# Jira Commit Audit — 2026-03-18

This file was created during a Jira audit to retroactively link Jira issues
to the commits that implemented them. The original filter-branch rewrite
(2026-03-18) added most issue keys to commit messages but missed five tickets.

## Retroactively linked issues

| Key | Summary | Implemented in | Root cause |
|-----|---------|----------------|------------|
| KAN-16 | Build player count selector UI | `0e28432` | Subtask of KAN-7; omitted from filter-branch rewrite |
| KAN-18 | Turn result display | `0e28432` | Key not included when remapping commits to ticket groups |
| KAN-20 | Accessory collection logic | `0e28432` | Key not included when remapping commits to ticket groups |
| KAN-21 | Crown rule | `0e28432` | Key not included when remapping commits to ticket groups |
| KAN-22 | Blocker item rule | `596345b` | Covered by KAN-27 (Black ring mechanic) but KAN-22 key omitted |

This linking commit (KAN-16 KAN-18 KAN-20 KAN-21 KAN-22) causes GitHub for
Jira to surface these issues in the Development panel of each ticket.

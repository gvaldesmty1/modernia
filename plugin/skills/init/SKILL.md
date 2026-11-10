---
name: init
description: Creates a new Modernia project in the current folder - the folders where the person drops the legacy system's documentation and source code, a short guide, and the Modernia workspace - and then hands over to /modernia:modernize. Use when the person wants to start a modernization project, set up Modernia in a folder, or says "init", "start a project", "create the project structure" or "where do I put the documents". / Crear un proyecto Modernia: carpetas para documentos y código, guía y espacio de trabajo.
---

# Modernia · Init

You set up a new modernization project in the **current folder**. Speak in the
person's language and in everyday terms.

1. `PLUGIN_ROOT` = two levels above this skill's base directory.
   `BOARD` = `node "<PLUGIN_ROOT>/scripts/board.mjs"`.
2. If `.modernia/config.json` already exists, there is already a project here.
   Say so, run `BOARD show`, and offer `/modernia:modernize` to continue. Stop.
3. Look at the current folder. If it has unrelated content (for example, it
   is the repository of another application), ask whether to create the
   project in a new subfolder instead (suggest a name based on the system).
   Never mix it with other projects' files.
4. Ask, in one message:
   - the **name** of the system;
   - the **language** of the deliverables (Spanish or English; default to the person's language);
   - whether they have **documentation**, **source code** or both;
   - whether that material is **already in another folder**. If so, they can
     either have it **copied** into the project or have it **referenced**
     where it is (useful when it is large or must not be duplicated);
   - optionally, the **cost or quality preference**: balanced (default), economy or maximum quality.
5. Create the structure. Folder names follow the language:

   | Spanish | English | Content |
   |---|---|---|
   | `fuentes/documentos/` | `sources/documents/` | Manuals, specifications, minutes, diagrams, screenshots |
   | `fuentes/codigo/` | `sources/code/` | The legacy source code |

   Create only the folders that apply. Then:
   - **Copy** the material if the person asked for that. Never move or delete
     their originals. Before copying a large folder, say how many files and
     MB it is, and ask for confirmation.
   - Write `LEEME.md` (Spanish) or `README.md` (English) at the project root,
     in the chosen language, with: the project name; the purpose of each
     folder; the accepted formats (Word, Excel, PowerPoint, PDF, images,
     text; legacy `.doc`/`.xls`/`.ppt` must be saved in the modern format);
     the next step (`/modernia:modernize`); how to see progress
     (`/modernia:status`, `/modernia:dashboard`); and a privacy note that
     `.modernia/` and `fuentes/` contain client material that must not go to
     a public repository.
   - If the folder is a git repository, or the person wants one, add a
     `.gitignore` that excludes `fuentes/` (or `sources/`) and `.modernia/`,
     unless the person explicitly wants to version them.
6. Register the project:

   ```bash
   BOARD init --name "<name>" --lang <es|en> [--docs "<documents path>"] [--code "<code path>"] [--policy <policy>] --plugin-root "<PLUGIN_ROOT>"
   ```

   Pass the project folders you created, or the external paths if the person
   chose to reference them. Empty folders are fine: the material can arrive later.
7. Close with at most 8 lines: the structure created (as a small tree), what
   to put where, and the next step. If the folders are still empty: "When the
   material is in place, write `/modernia:modernize`." If the material is
   already there, offer to start right away with `/modernia:modernize`.

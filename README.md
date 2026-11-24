# 1.3-Acre Farm Plan — Sungai Lalah, Pedas

Planning notes, graphics and animation for the 1.3-acre self-sufficient farm.

## Contents

| Folder | What it is |
|:---|:---|
| `notes/` | Obsidian notes: Block C cash-bed schedule, AI farm agents plan (draft v2) |
| `designs/block-c-cash-beds/` | Source of the Block C explainer graphic (Design canvas format) |
| `designs/ai-farm-agents/` | Source of the AI farm agents infographic (Design canvas format) |
| `app/` | Source of the **TaniSim app**: an installable phone app (PWA) that keeps these notes offline |
| `animation/ai-farm-agents/` | Source of the 20-second AI farm agents animation: scene list, styles, four scenes, score |

The design and animation files are source code for the claude.ai Design and Motion players; they don't run on their own in a browser.

## Live versions

- Block C graphic: https://claude.ai/artifact/5SPXwzKYFRhQymBuWLjYzG
- AI farm agents infographic: https://claude.ai/artifact/JFMjQ2iBVJuTohFasxPqY2
- AI farm agents animation: https://claude.ai/artifact/K8Y4s89J4Kq1VAzHULg5iX

These links are private until shared.

## TaniSim app (installable, works offline)

A small web app that puts the notes on your phone: this week's rhythm, the next dated milestones, every note in `notes/` (callouts, tables and diagrams included), and links to the live graphics. Once opened, it works with no signal.

**Publish it on Vercel:** at vercel.com → Add New → Project, import this repo and click Deploy. `vercel.json` already sets the build (`npm run build`, output `dist`). Every push to `main` redeploys. This works for private repos on the free plan.

**Install it:** open the Vercel link on your phone or computer.
- Windows / Mac: open it in Edge or Chrome and click **Install app** (or the install icon in the address bar).
- Android / Chrome / Edge: tap **Install app** in the top bar.
- iPhone / iPad: open the link in Safari, tap **Install app**, then follow the steps (Share → Add to Home Screen).

**Layout tab (build mode):** sketch the farm by dragging items from the tray onto a 1 m grid.
- Drag an item **up** out of the tray onto the land, or tap it to drop it in the middle.
- Tap an item to select it, then **Rotate**, **Copy**, **Delete**, give it a label (e.g. `C1`), or drag the ⊕ handles to resize beds, ponds, fields, paths and fences.
- Switch between **Plan** (top-down, for measuring) and **3D** (diorama view), turn the view 90°, pinch or scroll to zoom.
- Items can't overlap or leave the plot, except fields, paths and the road, which can sit under other things.
- **⋯ menu:** start from the Block C layout, set the plot size, save a picture (PNG), or export/import a layout file.
- The layout saves on the device. To move it to another phone or computer, use Export, then Import there.

**Update the notes:** edit or add `.md` files in `notes/` and push to `main`. The installed app shows "A newer version of your notes is ready — Reload" next time it's opened.

Milestones are read from checklist lines that end in a date, e.g. `- [ ] First cili padi pick (Mar 2027)`. Tick one (`- [x]`) to mark it done.

**Run it locally:**

```bash
npm install
npm run build
npm run serve   # http://localhost:4173
```

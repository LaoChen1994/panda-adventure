# 🤖 Antigravity Agent Guidelines & Rules

Here are the rules and guidelines you MUST follow when working on project codebases in this environment.

---

## 🌿 1. Git & Pull Request Branching Workflow
- **Branch Naming**: All new features, bug fixes, or modifications MUST use a dedicated branch (e.g., prefix with `gemini/`, `feature/`, or `bugfix/`).
- **Pre-Push MR Check**: Before pushing new commits to an existing development/MR branch, you MUST check if that branch's Pull Request/Merge Request has already been merged (using `gh pr view`, `glab mr view` or by checking git branch status):
  - **If Open/Not Merged**: You may push new commits to the same branch.
  - **If Merged/Closed**: You MUST create a brand new branch (e.g., append `-part2`, `-fix` to the branch name), commit the changes, push, and open a new Pull Request. Do not push to merged branches.
- **New Modifications**: For any completely new set of changes or requests from the user, ALWAYS create a new branch rather than reusing an old one.

---

## 🎍 2. 《熊猫探险》游戏道具图片美术规格规范 (Item Asset Specification)
This specification applies to all 54 items (`1.png` ~ `54.png`) under `public/assets/items/` to ensure uniform scaling, alignment, and display consistency in the game UI.

### 📐 Technical Specs
- **Dimensions**: Strictly **`256 × 256 pixels`** (1:1 aspect ratio).
- **Background**: **`100% transparent background (Alpha Channel)`**. No solid colors, borders, grid lines, or background boxes.
- **Format**: `PNG-32` with alpha channel support.

### 🎨 Composition & Safety Margins
- **Visual Centering**: The center of gravity of the item must align perfectly with the canvas center `(128, 128)`.
- **Safety Padding**: Keep at least **`15% padding`** on all sides (minimum `38 pixels` blank space from the edge).
- **Bounding Box**: The maximum bounds of the non-transparent pixels must not exceed **`180 × 180 pixels`**.

### 🖌️ Art Style & Visuals
- **Theme**: Chibi, bright, high-saturation, clean vector-cartoon style.
- **Outlines**: Clear outer outline of **`4 pixels`** (preferably dark/deep brown instead of solid black). Internal lines should be **`2 pixels`** thick.
- **Shadows & Effects**: No pre-rendered ground shadows or glowing rectangular frames. The engine handles shadows dynamically.
- **No Text**: The icon MUST NOT contain any words, labels, letters, or numbers.

### 💎 Quality Color Coding
- **⬜ White (Common: 1-15)**: Earthy natural colors (wood, stone, leather). No magical aura/sparkles.
- **🟩 Green (Uncommon: 16-27, 52)**: Vibrant greens, jade, bamboo, representing health and recovery.
- **🟦 Blue (Rare: 28-35, 41-43, 53)**: Electric blues, gold, representing rare gear or active items.
- **🟪 Purple (Epic: 36-40, 44-45, 54)**: Mystical purples, yin-yang blacks/whites, rainbow glow, representing legendary artifacts.

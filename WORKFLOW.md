# Safe edit → preview → ship workflow

`main` is the **live** branch (GitHub Pages → jasmineconcept.net).
Never edit `main` directly. New work happens on a branch, gets previewed
locally, and only reaches `main` when you approve it.

## 1. Start new work on a branch
```bash
git checkout main && git pull
git checkout -b my-change      # any name, e.g. "promo-banner"
```

## 2. Preview it locally (nothing goes live)
```bash
./preview.sh                   # opens http://localhost:8000
```
Look at it. Tweak. Re-save and refresh the browser. Repeat until happy.

## 3. Ship it live (only when you like it)
```bash
git add -A && git commit -m "describe the change"
git checkout main
git merge my-change
git push origin main           # THIS is the step that goes live
```

## 4. Roll back if something looks wrong after going live
Undo the last live change without losing history (safe, no force-push):
```bash
git checkout main
git revert HEAD --no-edit
git push origin main
```
Or jump everything back to the last known-good state:
```bash
git checkout main
git reset --hard live-good     # the tagged "liked" state
git push --force origin main
```

## Restore point
`live-good` is a git tag marking the last state you were happy with.
Update it whenever you reach a new "this is good" milestone:
```bash
git tag -f live-good main
git push -f origin live-good
```

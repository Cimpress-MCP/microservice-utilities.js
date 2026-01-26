# GitHub Actions Setup Guide

## ✅ Good News: CI Works Without Any Tokens!

The CI pipeline (tests, linting, build) works **without any secrets**. You only need tokens if you want **automatic npm publishing**.

## Optional Secrets (Only for Auto-Publishing)

If you want GitHub Actions to automatically publish to npm, you need these secrets. Otherwise, you can publish manually!

### 1. NPM_TOKEN (Required for Publishing)

**What it's for:** Authenticates with npm registry to publish packages

**How to create it:**

1. **Log in to npm** (if not already):
   ```bash
   npm login
   ```

2. **Create an Automation Token**:
   - Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Choose "Automation" token type (recommended for CI/CD)
   - Copy the token (you'll only see it once!)

3. **Add to GitHub Secrets**:
   - Go to your repository: `https://github.com/Cimpress-MCP/microservice-utilities.js/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

**Note:** You need to be added as a maintainer/collaborator on the npm package first!

### 2. GIT_TAG_PUSHER (Optional - for versioning)

**What it's for:** Creates git tags for versioning during release

**How to create it:**

1. **Create a GitHub Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "Git Tag Pusher"
   - Select scopes: `repo` (full control)
   - Generate and copy the token

2. **Add to GitHub Secrets**:
   - Same as above, but name it: `GIT_TAG_PUSHER`
   - Value: Your GitHub token

## Version Management

**Important:** The build process (`make.js`) sets the version from git tags using `ci-build-tools`. 

- If no git tag exists, it defaults to `0.0.0`
- To publish version `2.0.0`, you need to create a git tag first:
  ```bash
  git tag v2.0.0
  git push origin v2.0.0
  ```

## 🎯 Simple Approach: Manual Publishing (Recommended)

**No tokens needed!** Just publish manually when ready:

```bash
# 1. Make sure you're logged in
npm login

# 2. Build the package (sets version from git tags)
node make.js build

# 3. Publish
npm publish --access public
```

**Benefits:**
- ✅ No GitHub secrets needed
- ✅ CI still runs tests/linting automatically
- ✅ You control when to publish
- ✅ Simpler setup

## Testing the Workflow

**CI works without any secrets!** Just push your changes:

1. **Push your changes** to trigger the workflow
2. **Check Actions tab** in GitHub to see the workflow run
3. **Tests and linting will run automatically** ✅

**If you set up NPM_TOKEN:**
- Publishing will happen automatically on master/release branches
- If token is missing, publishing step is skipped (CI still passes)

## Troubleshooting

### "need auth" error
- **Problem:** NPM_TOKEN not set or invalid
- **Solution:** Verify token is correct and has "Automation" type

### Version shows as 0.0.0
- **Problem:** No git tag exists for versioning
- **Solution:** Create and push a git tag: `git tag v2.0.0 && git push origin v2.0.0`

### "You don't have permission to publish"
- **Problem:** Not added as maintainer on npm package
- **Solution:** Current owner needs to run: `npm owner add YOUR_USERNAME microservice-utilities`

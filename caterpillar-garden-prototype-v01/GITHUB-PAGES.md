# Put the game on GitHub Pages

## Upload

1. Unzip `caterpillar-garden-github-pages.zip`.
2. Create a GitHub repository named `caterpillar-garden`, using `main` as the default branch. A public repository works with GitHub Free.
3. Add the extracted contents to the repository root and commit them. `index.html`, `assets`, and `.github` must be directly inside the repository, not inside another game folder. GitHub Desktop can publish the complete folder, including hidden files.

On a Mac, press Command–Shift–Period in Finder to reveal `.github`, `.gitignore`, and `.nojekyll`. If using GitHub's web upload, include those files and folders too. Upload the extracted files, not the ZIP itself.

## Turn on publishing

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy game to GitHub Pages → Run workflow**, select `main`, then run it. Subsequent pushes to `main` publish automatically.
4. When the run finishes, open the address shown in its deployment or in **Settings → Pages**. For a repository named `caterpillar-garden`, it is normally `https://YOUR-USERNAME.github.io/caterpillar-garden/`.

The included workflow follows [GitHub's official Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). No custom secrets, package installation, or build command are needed. Only the game files and artwork are published; development tools and tests are left out.

If the initial automatic run failed because Pages was not yet enabled, use **Run workflow** after selecting the source above.

## Play on iPad

Open your published HTTPS address in Safari, in landscape, and let the first level load while online. Optionally choose **Share → Add to Home Screen**, then open that Home Screen version online once before testing airplane mode. The Mac's localhost preview address will not work on the iPad.

## Update later

Edit the game files, increment the `CACHE` version near the top of `sw.js`, and commit to `main`. Publishing runs automatically. Reopen the game online to pick up the update.

## Alternative: publish directly from the branch

The files also work without the included workflow. Remove `.github/workflows/pages.yml`, then choose **Settings → Pages → Deploy from a branch → main → /(root)**. Keep `.nojekyll` in the repository root. Use either this method or the Actions method above.

This package is ready to upload. Creating the package does not create a GitHub repository or publish the game.

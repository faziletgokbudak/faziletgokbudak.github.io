# faziletgokbudak.github.io

My personal website — research, publications, and experience.

🌐 **Live site:** <https://faziletgokbudak.github.io>

## Running locally

Requires [Ruby](https://www.ruby-lang.org/) and [Bundler](https://bundler.io/).

```bash
bundle install          # install dependencies (first time only)
bundle exec jekyll serve # serve at http://localhost:4000 with live reload
```

## Deployment

Pushing to `master` triggers the [`deploy.yml`](.github/workflows/deploy.yml)
GitHub Actions workflow, which builds the site with Jekyll, purges unused CSS,
and publishes it to GitHub Pages. No manual steps needed.

## Editing content

Most content lives in plain text files — no code changes required:

| What | Where |
| --- | --- |
| Homepage (bio, sections) | `_pages/about.md` |
| Site config (title, nav, features) | `_config.yml` |
| Publications | `_bibliography/papers.bib` |
| CV / experience / education | `_data/cv.yml` |
| News items | `_news/` |
| Images, PDFs, JS | `assets/` |

## Credits

Built on the [al-folio](https://github.com/alshedivat/al-folio) Jekyll theme.
Licensed under the [MIT License](LICENSE).

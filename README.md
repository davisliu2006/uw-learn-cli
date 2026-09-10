# uw-learn

CLI for [University of Waterloo LEARN](https://learn.uwaterloo.ca).

## Setup

```bash
npm install
npx playwright install chromium
npm run build
npm link
```

Or run without linking:

```bash
npm run dev
```

## Usage

```bash
uw-learn  # start interactive shell
```

### Commands

```
> login
> logout
> whoami
> list-courses (list)
> get-course <course> (get)
> download <start> [end] [-o <outdir>] [--dry-run]
> exit
```

`login` opens a Chromium window and saves session cookies.

`get` / `get-course` prints a numbered tree and selects that course for this shell. Use those line numbers with `download`.

`download` writes files to `<outdir>/{CourseCode}/` (`outdir` defaults to the current directory). It uses the course from the last `get` in this shell session.

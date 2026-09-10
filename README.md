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
npm run dev -- <command>
```

## Usage

```bash
# interactive shell
uw-learn
# one-shot commands still work        
uw-learn login
uw-learn courses
```

### Commands

```
> login
> logout
> whoami
> courses
> content <course>
> download <course> <start> [end] [-o <outdir>] [--dry-run]
> exit
```

`login` opens a Chromium window and saves session cookies.

`content` prints a numbered tree; use those line numbers with `download`.

`download` writes files to `<outdir>/{CourseCode}/` (`outdir` defaults to the current directory).


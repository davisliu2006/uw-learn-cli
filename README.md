# uw-learn

CLI for the [UWaterloo LEARN](https://learn.uwaterloo.ca) platform to help batch-pull files.

## Setup

```bash
# install dependencies
npm install
# install playwright browser core
npx playwright install chromium
# build
npm run build
# link the command
npm link
```

To run without linking:

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
> list-courses|list
> get-course|get <course>
> download <start> [end] [-o <outdir>] [--dry-run]
> open <line>
> exit
```

`login` opens a Chromium window and saves session cookies.

`logout` removes sesssion cookies.

`list` / `list-courses` lists all currently enrolled courses.

`get` / `get-course` selects the course for the shell and prints a tree of the course contents. Each line of the tree is numbered, which can be used as indices for `download` and `open`.

`download` writes files to `<outdir>/{CourseCode}/`. `outdir` defaults to the current working directory but can be set to a value like `~/Downloads`. It uses the course from the last `get` in the shell session.

`open` opens a course content item in the default browser (must already be signed into LEARN there). It uses the course from the last `get` in the shell session.
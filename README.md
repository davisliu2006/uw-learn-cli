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
> courses
> content <course>
> download <course>
> exit
```

`login` opens a Chromium window and saves session cookies.

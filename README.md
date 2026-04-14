# envault

> A CLI tool for securely managing and sharing `.env` files across teams using encrypted vaults.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize a new vault in your project:

```bash
envault init
```

Push your `.env` file to the vault:

```bash
envault push --env .env --vault my-project
```

Pull the latest secrets to your local environment:

```bash
envault pull --vault my-project --out .env
```

Share access with a teammate:

```bash
envault invite teammate@example.com --vault my-project
```

### Example Workflow

```bash
# First-time setup
envault init --vault my-project

# Developer A pushes secrets
envault push --env .env --vault my-project

# Developer B pulls secrets
envault pull --vault my-project --out .env
```

---

## Requirements

- Node.js 18+
- An `envault` account or self-hosted instance

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss any major changes.

---

## License

[MIT](./LICENSE)
# Lorrgs

This repository contains the frontend code for lorrgs.io, a website to analyze abd
compare cooldown usage in World of Warcraft.

The backend code can be found [here](https://github.com/gitarrg/lorrgs)


## Links

👉 [Lorrgs.io](https://lorrgs.io/)  
👉 [Discord](https://discord.gg/899M8AvVjU/)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

---

## Development

### first time setup

```bash

# 1) Install Node.js (v24.4.1)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24


# 2) Clone the repository
git clone git@github.com:gitarrg/lorrgs-frontend.git
cd lorrgs-frontend

# 2) install dependencies
npm install
```

### Running the local dev server

```bash
npm run server
```

This will start the development server. By default, it runs on http://localhost:9001/ (or the port specified in your config).

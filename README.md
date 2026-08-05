# GoHitRate

> Zero-install local API load tester. Download, run, done.

GoHitRate is a lightweight local API load testing tool built for developers who just want to hammer an endpoint without installing anything. Download the binary, run it, and your browser opens ready to go.

## Features

- Single binary, no runtime, no npm, no Python
- Browser-based UI that opens automatically
- Targets local and private network addresses only by default
- Builds available for Windows, macOS, and Linux

## Why a browser UI?

A native desktop GUI would mean platform-specific code and a much larger binary. Instead GoHitRate starts a local web server and opens your browser automatically. The entire frontend is embedded inside the binary so there are no loose files, no extensions, and nothing extra to install.

## Built With

- [Go](https://golang.org/): backend, HTTP server, binary compilation
- [Vegeta](https://github.com/tsenart/vegeta): load testing engine
- HTML, CSS, vanilla JavaScript: frontend embedded into the binary via `go:embed`

## Download & Run

Grab the binary for your platform from the [Releases](https://github.com/kmskuus/gohitrate/releases) page.

**Windows:** double-click `gohitrate-windows-amd64.exe`  
**macOS/Linux:** `chmod +x gohitrate-* && ./gohitrate-*`

Browser opens at `http://localhost:8080`

## Development

Uses a VS Code devcontainer. Open in VS Code with the Dev Containers extension and select **Reopen in Container**.

## Disclaimer

Claude AI (Anthropic) was used during development. All decisions, testing, and review were done by the author.

## License

[MIT](LICENSE)

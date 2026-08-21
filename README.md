# GoHitRate

> Zero-install local API load tester. Download, run, done.

GoHitRate is a lightweight tool for load testing local HTTP and HTTPS API endpoints during development. No installation, no configuration files, no dependencies. Download the binary, run it, and your browser opens ready to go.

## Features

- Single binary — no runtime, no npm, no Python required
- Supports HTTP and HTTPS endpoints
- Configure method (GET, POST, PUT, PATCH, DELETE), requests per second and duration
- Add custom request headers and JSON request body for authenticated or data endpoints
- Results include total requests, success rate, mean latency, P95 latency and a per-second latency graph
- Dark and light theme with system preference detection
- Only targets local and private network addresses by default — safe to run without risk of hitting public APIs accidentally
- Builds available for Windows, macOS, and Linux

## UI

<details>
<summary>☾ Dark mode</summary>

![GoHitRate dark mode](assets/screenshot-dark.png)

</details>

<details>
<summary>☼ Light mode</summary>

![GoHitRate light mode](assets/screenshot-light.png)

</details>

## Download & Run

Grab the binary for your platform from the [Releases](https://github.com/kmskuus/gohitrate/releases) page.

**Windows:** Double-click `gohitrate-windows-amd64.exe`

**Linux:**

```bash
chmod +x gohitrate-linux-amd64
./gohitrate-linux-amd64
```

**macOS (Intel):**

```bash
chmod +x gohitrate-macos-amd64
./gohitrate-macos-amd64
```

**macOS (Apple Silicon — M1/M2/M3/M4):**

```bash
chmod +x gohitrate-macos-arm64
./gohitrate-macos-arm64
```

The browser will automatically open the UI using a free port assigned by your operating system. You can also see the chosen port printed in your terminal window. This guarantees no conflicts with your running APIs and ensures only safe, unprivileged ports are used.

### Windows SmartScreen warning

Windows may show a security warning the first time you run GoHitRate. This is expected for unsigned open source software.
To proceed:

<details>
<summary>1. Click **More info**</summary>

![SmartScreen step 1](assets/smartscreen-1.png)

</details>

<details>
<summary>2. Click **Run anyway**</summary>

![SmartScreen step 2](assets/smartscreen-2.png)

</details>

### macOS security warning

macOS may show a security warning the first time you run GoHitRate. This is expected for unsigned open-source software.

To proceed:

1. Open the downloaded binary.
2. If macOS shows a warning that the application cannot be opened, click **Done**.
3. Open **System Settings → Privacy & Security**.
4. Scroll down to the **Security** section.
5. Click **Open Anyway** next to the message about GoHitRate.
6. Confirm by clicking **Open Anyway** when prompted.

## Why a browser UI?

A native desktop GUI would mean platform-specific code and a much larger binary. Instead GoHitRate starts a local web server and opens your browser automatically. The entire frontend is embedded inside the binary — no loose files or extra installs.

## Built With

- [Go](https://golang.org/): backend, HTTP server, binary compilation
- [Vegeta](https://github.com/tsenart/vegeta): load testing engine
- HTML, CSS, vanilla JavaScript: frontend embedded into the binary via `go:embed`

## Development

Uses a VS Code devcontainer. Open in VS Code with the Dev Containers extension and select **Reopen in Container**.

## Disclaimer

Claude AI (Anthropic) was used during development. All decisions, testing, and review were done by the author.

## License

[MIT](LICENSE)

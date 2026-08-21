// main.go is the entry point for GoHitRate. It starts the HTTP server,
// serves the embedded frontend, and exposes the /api/run endpoint.
package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
	"time"

	"github.com/kmskuus/gohitrate/internal/runner"
	"github.com/kmskuus/gohitrate/internal/safety"
)

// webFiles holds the embedded frontend files from the web/ directory.
// These are baked into the binary at compile time via go:embed.
//go:embed web
var webFiles embed.FS

// runRequest represents the JSON payload sent from the frontend
// when the user clicks Run Test.
type runRequest struct {
	URL      string            `json:"url"`
	Method   string            `json:"method"`
	RPS      int               `json:"rps"`
	Duration int               `json:"duration"`
	Body     string            `json:"body"`
	Headers  map[string]string `json:"headers"`
}

// runResponse is the JSON response sent back to the frontend
// after a load test completes or fails.
type runResponse struct {
	Success     bool               `json:"success"`
	Error       string             `json:"error,omitempty"`
	TotalReqs   uint64             `json:"totalRequests,omitempty"`
	SuccessRate float64            `json:"successRate,omitempty"`
	MeanLatency string             `json:"meanLatency,omitempty"`
	P95Latency  string             `json:"p95Latency,omitempty"`
	Errors      []string           `json:"errors,omitempty"`
	Timeline    []runner.DataPoint `json:"timeline,omitempty"`
}

// runHandler handles POST /api/run requests from the frontend.
// It validates the target URL, runs the load test, and returns results as JSON.
func runHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req runRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(runResponse{Success: false, Error: "invalid request"})
		return
	}

	// validate the target URL is local or private before running
	safe, err := safety.IsURLSafe(req.URL)
	if !safe {
		json.NewEncoder(w).Encode(runResponse{Success: false, Error: err.Error()})
		return
	}

	results := runner.Run(runner.Config{
		URL:      req.URL,
		Method:   req.Method,
		RPS:      req.RPS,
		Duration: req.Duration,
		Body:     req.Body,
		Headers:  req.Headers,
	})

	json.NewEncoder(w).Encode(runResponse{
		Success:     true,
		TotalReqs:   results.TotalRequests,
		SuccessRate: results.SuccessRate,
		MeanLatency: results.MeanLatency.String(),
		P95Latency:  results.P95Latency.String(),
		Errors:      results.Errors,
		Timeline:    results.Timeline,
	})
}

// openBrowser opens the default browser to the given URL.
// Called in a goroutine on startup with a short delay to allow the server to start.
func openBrowser(url string) {
	time.Sleep(500 * time.Millisecond)
	switch runtime.GOOS {
	case "windows":
		exec.Command("cmd", "/c", "start", url).Start()
	case "darwin":
		exec.Command("open", url).Start()
	default:
		exec.Command("xdg-open", url).Start()
	}
}

func main() {
	// strip the web/ prefix so files are served from root /
	webFS, err := fs.Sub(webFiles, "web")
	if err != nil {
		log.Fatal(err)
	}

	// 1. Listen on port 0 (explicitly on IPv4 loopback for maximum compatibility)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// 2. Extract the port and assign it to servicePort 
	servicePort := strconv.Itoa(listener.Addr().(*net.TCPAddr).Port)
	
	// Format the URL using localhost instead of the IP address!
	url := fmt.Sprintf("http://localhost:%s", servicePort)

	fmt.Printf("GoHitRate started!\n")
	fmt.Printf("Opening browser to %s\n", url)

	// open browser in background after server starts
	go openBrowser(url)

	http.Handle("/", http.FileServer(http.FS(webFS)))
	http.HandleFunc("/api/run", runHandler)

	// 3. Start the server
	log.Fatal(http.Serve(listener, nil))
}
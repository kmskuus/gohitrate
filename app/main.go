package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"github.com/kmskuus/gohitrate/internal/runner"
	"github.com/kmskuus/gohitrate/internal/safety"
)

//go:embed web
var webFiles embed.FS

var servicePort = "8080"

type runRequest struct {
	URL      string `json:"url"`
	Method   string `json:"method"`
	RPS      int    `json:"rps"`
	Duration int    `json:"duration"`
}

type runResponse struct {
	Success     bool     `json:"success"`
	Error       string   `json:"error,omitempty"`
	TotalReqs   uint64   `json:"totalRequests,omitempty"`
	SuccessRate float64  `json:"successRate,omitempty"`
	MeanLatency string   `json:"meanLatency,omitempty"`
	P95Latency  string   `json:"p95Latency,omitempty"`
	Errors      []string `json:"errors,omitempty"`
	Timeline    []runner.DataPoint  `json:"timeline,omitempty"`
}

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

func main() {
	webFS, err := fs.Sub(webFiles, "web")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.FileServer(http.FS(webFS)))
	http.HandleFunc("/api/run", runHandler)

	fmt.Println("GoHitRate running at http://localhost:" + servicePort)
	log.Fatal(http.ListenAndServe(":"+servicePort, nil))
}
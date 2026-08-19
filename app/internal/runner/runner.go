// runner.go handles the execution of load tests using the Vegeta engine.
// It fires HTTP requests at the configured rate and collects both summary
// and per-second metrics for display in the frontend.
package runner

import (
	"net/http"
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"
)

// Config holds the parameters for a single load test run.
// Populated from the frontend request in main.go and passed to Run.
type Config struct {
	URL      string
	Method   string
	RPS      int
	Duration int
	Body     string
	Headers  map[string]string
}

// DataPoint represents metrics for a single second of the load test.
// Used to build the latency over time graph in the frontend.
type DataPoint struct {
	Second  int     `json:"second"`
	Latency float64 `json:"latency"`
	Success bool    `json:"success"`
}

// Results holds the outcome of a completed load test.
// Returned by Run and serialized to JSON in main.go.
type Results struct {
	TotalRequests uint64
	SuccessRate   float64
	MeanLatency   time.Duration
	P95Latency    time.Duration
	Errors        []string
	Timeline      []DataPoint
}

// Run executes a load test with the given Config using the Vegeta engine.
// It collects both aggregate metrics and per-second buckets for the timeline.
// Called by runHandler in main.go after the target URL passes safety checks.
func Run(config Config) Results {
	rate := vegeta.Rate{Freq: config.RPS, Per: time.Second}
	duration := time.Duration(config.Duration) * time.Second

	// build the base target with optional body and headers
	target := vegeta.Target{
		Method: config.Method,
		URL:    config.URL,
	}

	if config.Body != "" {
		target.Body = []byte(config.Body)
	}

	if len(config.Headers) > 0 {
		target.Header = make(http.Header)
		for key, value := range config.Headers {
			target.Header.Set(key, value)
		}
	}

	targeter := vegeta.NewStaticTargeter(target)
	attacker := vegeta.NewAttacker()

	var metrics vegeta.Metrics
	timeline := make([]DataPoint, 0)
	buckets := make(map[int]*vegeta.Metrics)
	startTime := time.Now()

	// fire requests and collect each response into aggregate and per-second buckets
	for res := range attacker.Attack(targeter, rate, duration, "gohitrate") {
		metrics.Add(res)

		second := int(time.Since(startTime).Seconds())
		if _, exists := buckets[second]; !exists {
			buckets[second] = &vegeta.Metrics{}
		}
		buckets[second].Add(res)
	}
	metrics.Close()

	// build timeline by closing each bucket and extracting mean latency in milliseconds
	for i := 0; i < config.Duration; i++ {
		if bucket, exists := buckets[i]; exists {
			bucket.Close()
			timeline = append(timeline, DataPoint{
				Second:  i + 1,
				Latency: float64(bucket.Latencies.Mean) / float64(time.Millisecond),
				Success: bucket.Success == 1.0,
			})
		}
	}

	results := Results{
		TotalRequests: metrics.Requests,
		SuccessRate:   metrics.Success * 100,
		MeanLatency:   metrics.Latencies.Mean,
		P95Latency:    metrics.Latencies.P95,
		Errors:        make([]string, 0),
		Timeline:      timeline,
	}

	// collect any error messages from the aggregate metrics
	for _, err := range metrics.Errors {
		results.Errors = append(results.Errors, err)
	}

	return results
}
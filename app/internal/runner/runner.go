package runner

import (
	"time"

	vegeta "github.com/tsenart/vegeta/v12/lib"
)

type Config struct {
	URL      string
	Method   string
	RPS      int
	Duration int
}

type Results struct {
	TotalRequests uint64
	SuccessRate   float64
	MeanLatency   time.Duration
	P95Latency    time.Duration
	Errors        []string
}

func Run(config Config) Results {
	rate := vegeta.Rate{Freq: config.RPS, Per: time.Second}
	duration := time.Duration(config.Duration) * time.Second

	targeter := vegeta.NewStaticTargeter(vegeta.Target{
		Method: config.Method,
		URL:    config.URL,
	})

	attacker := vegeta.NewAttacker()
	var metrics vegeta.Metrics

	for res := range attacker.Attack(targeter, rate, duration, "gohitrate") {
		metrics.Add(res)
	}
	metrics.Close()

	results := Results{
		TotalRequests: metrics.Requests,
		SuccessRate:   metrics.Success * 100,
		MeanLatency:   metrics.Latencies.Mean,
		P95Latency:    metrics.Latencies.P95,
		Errors:        make([]string, 0),
	}

	for _, err := range metrics.Errors {
		results.Errors = append(results.Errors, err)
	}

	return results
}
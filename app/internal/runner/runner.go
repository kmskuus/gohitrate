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

type DataPoint struct {
	Second  int     `json:"second"`
	Latency float64 `json:"latency"`
	Success bool    `json:"success"`
}

type Results struct {
	TotalRequests uint64
	SuccessRate   float64
	MeanLatency   time.Duration
	P95Latency    time.Duration
	Errors        []string
	Timeline      []DataPoint
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
	timeline := make([]DataPoint, 0)

	// track per second metrics
	buckets := make(map[int]*vegeta.Metrics)
	startTime := time.Now()

	for res := range attacker.Attack(targeter, rate, duration, "gohitrate") {
		metrics.Add(res)

		second := int(time.Since(startTime).Seconds())
		if _, exists := buckets[second]; !exists {
			buckets[second] = &vegeta.Metrics{}
		}
		buckets[second].Add(res)
	}
	metrics.Close()

	// build timeline from buckets
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

	for _, err := range metrics.Errors {
		results.Errors = append(results.Errors, err)
	}

	return results
}
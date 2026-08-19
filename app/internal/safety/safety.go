// safety.go enforces IP restrictions on target URLs before any load test runs.
// By default only local and private network addresses are permitted.
package safety

import (
	"fmt"
	"net"
	"net/url"
)

// enforceOnlyLocalIPs is the core safety guardrail of GoHitRate.
// When true, only loopback and private network addresses are allowed as targets.
// This prevents accidental load testing of public endpoints.
// To target an authorized external environment, set this to false and recompile.
var enforceOnlyLocalIPs = true

// IsURLSafe validates that the given URL is safe to use as a load test target.
// It checks the scheme, resolves the hostname, and verifies the resolved IP
// is within allowed local/private ranges when enforceOnlyLocalIPs is true.
// Called by runHandler in main.go before every test run.
func IsURLSafe(rawURL string) (bool, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return false, fmt.Errorf("invalid URL: %w", err)
	}

	// only http and https are valid target schemes
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return false, fmt.Errorf("only http and https URLs are allowed")
	}

	host := parsed.Hostname()

	// resolve hostname to IP addresses
	ips, err := net.LookupHost(host)
	if err != nil {
		return false, fmt.Errorf("could not resolve host: %w", err)
	}

	// if safety guardrail is disabled, allow any resolved IP
	if !enforceOnlyLocalIPs {
		return true, nil
	}

	// verify every resolved IP is within local or private ranges
	for _, ipStr := range ips {
		ip := net.ParseIP(ipStr)
		if ip == nil {
			return false, fmt.Errorf("could not parse IP: %s", ipStr)
		}
		if !isPrivateOrLoopback(ip) {
			return false, fmt.Errorf("host resolves to public IP %s — only local and private network addresses are allowed", ipStr)
		}
	}

	return true, nil
}

// isPrivateOrLoopback checks if the given IP falls within a loopback
// or private network range. Only called internally by IsURLSafe.
func isPrivateOrLoopback(ip net.IP) bool {
	privateRanges := []string{
		"127.0.0.0/8",   // loopback
		"10.0.0.0/8",    // private class A
		"172.16.0.0/12", // private class B
		"192.168.0.0/16", // private class C
		"::1/128",        // IPv6 loopback
	}

	for _, cidr := range privateRanges {
		_, network, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}
		if network.Contains(ip) {
			return true
		}
	}

	return false
}
package safety

import (
	"fmt"
	"net"
	"net/url"
)

// enforceOnlyLocalIPs controls whether public IPs are blocked.
// Set to false and recompile if you need to target an authorized external environment.
var enforceOnlyLocalIPs = true

func IsURLSafe(rawURL string) (bool, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return false, fmt.Errorf("invalid URL: %w", err)
	}

	// only allow http and https
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return false, fmt.Errorf("only http and https URLs are allowed")
	}

	host := parsed.Hostname()

	ips, err := net.LookupHost(host)
	if err != nil {
		return false, fmt.Errorf("could not resolve host: %w", err)
	}

	if !enforceOnlyLocalIPs {
		return true, nil
	}

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

func isPrivateOrLoopback(ip net.IP) bool {
	privateRanges := []string{
		"127.0.0.0/8",    // loopback
		"10.0.0.0/8",     // private
		"172.16.0.0/12",  // private
		"192.168.0.0/16", // private
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
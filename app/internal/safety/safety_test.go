package safety

import (
	"testing"
)

// TestIsURLSafe verifies that IsURLSafe correctly allows local/private URLs
// and rejects invalid schemes.
// Each test case runs independently under its own name, visible in test output.
func TestIsURLSafe(t *testing.T) {

	// Each entry in this slice is one test case.
	// name     — shown in test output so you know which case failed
	// url      — the input URL to test
	// wantOK   — whether we expect IsURLSafe to return true
	// wantErr  — whether we expect IsURLSafe to return an error
	tests := []struct {
		name    string
		url     string
		wantOK  bool
		wantErr bool
	}{
		{
			// localhost should always be allowed — typical local dev target
			name:    "localhost is allowed",
			url:     "http://localhost/api",
			wantOK:  true,
			wantErr: false,
		},
		{
			// explicit loopback IP should be allowed, same as localhost
			name:    "loopback IP is allowed",
			url:     "http://127.0.0.1/api",
			wantOK:  true,
			wantErr: false,
		},
		{
			// private network range (192.168.x.x) should be allowed — typical home/office network
			name:    "private class C is allowed",
			url:     "http://192.168.1.1/api",
			wantOK:  true,
			wantErr: false,
		},
		{
			// ftp:// is not a valid scheme — only http and https are accepted
			name:    "ftp scheme is rejected",
			url:     "ftp://localhost/api",
			wantOK:  false,
			wantErr: true,
		},
	}

	// range over each test case and run it as its own sub-test
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			ok, err := IsURLSafe(tt.url)

			// check if the safe/unsafe result matches what we expected
			if ok != tt.wantOK {
				t.Errorf("got ok=%v, want %v", ok, tt.wantOK)
			}

			// check if an error was returned when we expected one (or not)
			if (err != nil) != tt.wantErr {
				t.Errorf("got err=%v, wantErr=%v", err, tt.wantErr)
			}
		})
	}
}
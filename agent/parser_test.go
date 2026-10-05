package main

import (
	"os"
	"testing"
)

func ptrInt(i int) *int { return &i }
func ptrInt64(i int64) *int64 { return &i }
func ptrBool(b bool) *bool { return &b }
func ptrString(s string) *string { return &s }

func TestParseSmart(t *testing.T) {
	tests := []struct {
		name     string
		file     string
		expected UniversalMetrics
	}{
		{
			name: "NVMe OK",
			file: "testdata/nvme_ok.json",
			expected: UniversalMetrics{
				Protocol:         "NVMe",
				MediaType:        "nvme",
				DeviceModel:      ptrString("NVMe IM2P33F4 256GB"),
				DeviceSerial:     ptrString("SANITIZED-NVME-0001"),
				TemperatureC:     ptrInt(46),
				PowerOnHours:     ptrInt64(5867),
				LifeRemainingPct: ptrInt(81), // 100 - 19
				MediaErrors:      ptrInt64(0),
				CriticalWarnings: ptrInt(0),
				SmartPassed:      ptrBool(true),
			},
		},
		{
			name: "SATA HDD OK",
			file: "testdata/sata_hdd_ok.json",
			expected: UniversalMetrics{
				Protocol:         "ATA",
				MediaType:        "hdd",
				DeviceModel:      ptrString("ST1000DM003-1ER162"),
				DeviceSerial:     ptrString("SANITIZED-HDD-0001"),
				TemperatureC:     ptrInt(35),
				PowerOnHours:     ptrInt64(12345),
				LifeRemainingPct: nil,
				MediaErrors:      ptrInt64(0),
				CriticalWarnings: ptrInt(0),
				SmartPassed:      ptrBool(true),
			},
		},
		{
			name: "SATA HDD Failing",
			file: "testdata/sata_hdd_failing.json",
			expected: UniversalMetrics{
				Protocol:         "ATA",
				MediaType:        "hdd",
				DeviceModel:      ptrString("WDC WD10EZEX-00BN5A0"),
				DeviceSerial:     ptrString("SANITIZED-HDD-0002"),
				TemperatureC:     ptrInt(41),
				PowerOnHours:     ptrInt64(30210),
				LifeRemainingPct: nil,
				MediaErrors:      ptrInt64(37), // 8 (ID 5) + 2 (ID 187) + 24 (ID 197) + 3 (ID 198) = 37
				CriticalWarnings: ptrInt(1),  // Reallocated_Sector_Ct has when_failed: "now"
				SmartPassed:      ptrBool(false),
			},
		},
		{
			name: "SATA SSD Wear",
			file: "testdata/sata_ssd_samsung.json",
			expected: UniversalMetrics{
				Protocol:         "ATA",
				MediaType:        "ssd",
				DeviceModel:      ptrString("Samsung SSD 850 EVO 250GB"),
				DeviceSerial:     ptrString("SANITIZED-SSD-0001"),
				TemperatureC:     ptrInt(28),
				PowerOnHours:     ptrInt64(20000),
				LifeRemainingPct: ptrInt(92), // Wear_Leveling_Count has value 92
				MediaErrors:      ptrInt64(0),
				CriticalWarnings: ptrInt(0),
				SmartPassed:      ptrBool(true),
			},
		},
		{
			name: "SATA SSD No Wear",
			file: "testdata/sata_ssd_nowear.json",
			expected: UniversalMetrics{
				Protocol:         "ATA",
				MediaType:        "ssd",
				DeviceModel:      ptrString("Generic SATA SSD 128GB"),
				DeviceSerial:     ptrString("SANITIZED-SSD-0002"),
				TemperatureC:     ptrInt(31),
				PowerOnHours:     ptrInt64(8000),
				LifeRemainingPct: nil, // No wear attributes (177, 231, etc.)
				MediaErrors:      ptrInt64(0),
				CriticalWarnings: ptrInt(0),
				SmartPassed:      ptrBool(true),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			raw, err := os.ReadFile(tt.file)
			if err != nil {
				t.Fatalf("Failed to read testdata file: %v", err)
			}

			parsed, err := parseSmart(raw)
			if err != nil {
				t.Fatalf("parseSmart failed: %v", err)
			}

			if parsed.Metrics.Protocol != tt.expected.Protocol {
				t.Errorf("Protocol: expected %v, got %v", tt.expected.Protocol, parsed.Metrics.Protocol)
			}
			if parsed.Metrics.MediaType != tt.expected.MediaType {
				t.Errorf("MediaType: expected %v, got %v", tt.expected.MediaType, parsed.Metrics.MediaType)
			}
			
			if tt.expected.DeviceModel != nil && (parsed.Metrics.DeviceModel == nil || *parsed.Metrics.DeviceModel != *tt.expected.DeviceModel) {
				got := "nil"
				if parsed.Metrics.DeviceModel != nil {
					got = *parsed.Metrics.DeviceModel
				}
				t.Errorf("DeviceModel: expected %v, got %v", *tt.expected.DeviceModel, got)
			}
			
			if tt.expected.DeviceSerial != nil && (parsed.Metrics.DeviceSerial == nil || *parsed.Metrics.DeviceSerial != *tt.expected.DeviceSerial) {
				got := "nil"
				if parsed.Metrics.DeviceSerial != nil {
					got = *parsed.Metrics.DeviceSerial
				}
				t.Errorf("DeviceSerial: expected %v, got %v", *tt.expected.DeviceSerial, got)
			}

			if tt.expected.TemperatureC != nil && (parsed.Metrics.TemperatureC == nil || *parsed.Metrics.TemperatureC != *tt.expected.TemperatureC) {
				got := -1
				if parsed.Metrics.TemperatureC != nil {
					got = *parsed.Metrics.TemperatureC
				}
				t.Errorf("TemperatureC: expected %v, got %v", *tt.expected.TemperatureC, got)
			}

			if tt.expected.PowerOnHours != nil && (parsed.Metrics.PowerOnHours == nil || *parsed.Metrics.PowerOnHours != *tt.expected.PowerOnHours) {
				got := int64(-1)
				if parsed.Metrics.PowerOnHours != nil {
					got = *parsed.Metrics.PowerOnHours
				}
				t.Errorf("PowerOnHours: expected %v, got %v", *tt.expected.PowerOnHours, got)
			}

			if tt.expected.LifeRemainingPct == nil && parsed.Metrics.LifeRemainingPct != nil {
				t.Errorf("LifeRemainingPct: expected nil, got %v", *parsed.Metrics.LifeRemainingPct)
			} else if tt.expected.LifeRemainingPct != nil && (parsed.Metrics.LifeRemainingPct == nil || *parsed.Metrics.LifeRemainingPct != *tt.expected.LifeRemainingPct) {
				got := -1
				if parsed.Metrics.LifeRemainingPct != nil {
					got = *parsed.Metrics.LifeRemainingPct
				}
				t.Errorf("LifeRemainingPct: expected %v, got %v", *tt.expected.LifeRemainingPct, got)
			}

			if tt.expected.MediaErrors != nil && (parsed.Metrics.MediaErrors == nil || *parsed.Metrics.MediaErrors != *tt.expected.MediaErrors) {
				got := int64(-1)
				if parsed.Metrics.MediaErrors != nil {
					got = *parsed.Metrics.MediaErrors
				}
				t.Errorf("MediaErrors: expected %v, got %v", *tt.expected.MediaErrors, got)
			}

			if tt.expected.CriticalWarnings != nil && (parsed.Metrics.CriticalWarnings == nil || *parsed.Metrics.CriticalWarnings != *tt.expected.CriticalWarnings) {
				got := -1
				if parsed.Metrics.CriticalWarnings != nil {
					got = *parsed.Metrics.CriticalWarnings
				}
				t.Errorf("CriticalWarnings: expected %v, got %v", *tt.expected.CriticalWarnings, got)
			}

			if tt.expected.SmartPassed != nil && (parsed.Metrics.SmartPassed == nil || *parsed.Metrics.SmartPassed != *tt.expected.SmartPassed) {
				got := false
				if parsed.Metrics.SmartPassed != nil {
					got = *parsed.Metrics.SmartPassed
				}
				t.Errorf("SmartPassed: expected %v, got %v", *tt.expected.SmartPassed, got)
			}
		})
	}
}

func TestPrunePayload(t *testing.T) {
	raw, err := os.ReadFile("testdata/sata_hdd_failing.json")
	if err != nil {
		t.Fatalf("Failed to read testdata file: %v", err)
	}

	parsed, err := parseSmart(raw)
	if err != nil {
		t.Fatalf("parseSmart failed: %v", err)
	}

	if _, exists := parsed.RawPayload["ata_smart_error_log"]; exists {
		t.Errorf("Expected ata_smart_error_log to be removed")
	}
	if _, exists := parsed.RawPayload["ata_smart_self_test_log"]; exists {
		t.Errorf("Expected ata_smart_self_test_log to be removed")
	}
}

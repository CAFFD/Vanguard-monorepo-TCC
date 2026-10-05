package main

import (
	"encoding/json"
	"fmt"
)

// UniversalMetrics representa as métricas comuns extraídas de qualquer disco
type UniversalMetrics struct {
	Protocol         string
	MediaType        string
	DeviceModel      *string
	DeviceSerial     *string
	TemperatureC     *int
	PowerOnHours     *int64
	LifeRemainingPct *int
	MediaErrors      *int64
	CriticalWarnings *int
	SmartPassed      *bool
}

// ParsedSmart contém as métricas extraídas e o payload podado
type ParsedSmart struct {
	Metrics    UniversalMetrics
	RawPayload map[string]interface{}
}

// parseSmart processa o JSON bruto do smartctl e retorna as métricas universais e o payload podado.
func parseSmart(rawJSON []byte) (ParsedSmart, error) {
	var root map[string]interface{}
	if err := json.Unmarshal(rawJSON, &root); err != nil {
		return ParsedSmart{}, fmt.Errorf("JSON parse error: %w", err)
	}

	// Identificar protocolo básico
	protocol := "unknown"
	if device, ok := root["device"].(map[string]interface{}); ok {
		if p, pOk := device["protocol"].(string); pOk {
			protocol = p
		}
	}

	var metrics UniversalMetrics

	// Tentar NVMe
	if _, ok := root["nvme_smart_health_information_log"]; ok {
		metrics = extractNVMe(root, protocol)
	} else if _, ok := root["ata_smart_attributes"]; ok {
		metrics = extractATA(root, protocol)
	} else {
		metrics = UniversalMetrics{
			Protocol:  protocol,
			MediaType: "unknown",
		}
	}

	if m, ok := root["model_name"].(string); ok {
		metrics.DeviceModel = &m
	}
	if s, ok := root["serial_number"].(string); ok {
		metrics.DeviceSerial = &s
	}

	return ParsedSmart{
		Metrics:    metrics,
		RawPayload: prunePayload(root),
	}, nil
}

func extractNVMe(root map[string]interface{}, defaultProtocol string) UniversalMetrics {
	metrics := UniversalMetrics{
		Protocol:  defaultProtocol,
		MediaType: "nvme",
	}

	if metrics.Protocol == "unknown" || metrics.Protocol == "" {
		metrics.Protocol = "nvme"
	}

	if tempMap, ok := root["temperature"].(map[string]interface{}); ok {
		if cur, ok := tempMap["current"].(float64); ok {
			v := int(cur)
			metrics.TemperatureC = &v
		}
	}

	if poMap, ok := root["power_on_time"].(map[string]interface{}); ok {
		if hours, ok := poMap["hours"].(float64); ok {
			v := int64(hours)
			metrics.PowerOnHours = &v
		}
	}

	if statusMap, ok := root["smart_status"].(map[string]interface{}); ok {
		if passed, ok := statusMap["passed"].(bool); ok {
			metrics.SmartPassed = &passed
		}
	}

	if nvmeLog, ok := root["nvme_smart_health_information_log"].(map[string]interface{}); ok {
		if pct, ok := nvmeLog["percentage_used"].(float64); ok {
			life := 100 - int(pct)
			if life < 0 {
				life = 0
			} else if life > 100 {
				life = 100
			}
			metrics.LifeRemainingPct = &life
		}
		if errs, ok := nvmeLog["media_errors"].(float64); ok {
			v := int64(errs)
			metrics.MediaErrors = &v
		}
		if warns, ok := nvmeLog["critical_warning"].(float64); ok {
			w := int(warns)
			count := 0
			for w > 0 {
				count += w & 1
				w >>= 1
			}
			metrics.CriticalWarnings = &count
		}
	}

	return metrics
}

func extractATA(root map[string]interface{}, defaultProtocol string) UniversalMetrics {
	metrics := UniversalMetrics{
		Protocol:  defaultProtocol,
		MediaType: "unknown",
	}

	if metrics.Protocol == "unknown" || metrics.Protocol == "" {
		metrics.Protocol = "ata"
	}

	if rotRate, ok := root["rotation_rate"].(float64); ok {
		if rotRate > 0 {
			metrics.MediaType = "hdd"
		} else if rotRate == 0 {
			metrics.MediaType = "ssd"
		}
	}

	if tempMap, ok := root["temperature"].(map[string]interface{}); ok {
		if cur, ok := tempMap["current"].(float64); ok {
			v := int(cur)
			metrics.TemperatureC = &v
		}
	}

	if poMap, ok := root["power_on_time"].(map[string]interface{}); ok {
		if hours, ok := poMap["hours"].(float64); ok {
			v := int64(hours)
			metrics.PowerOnHours = &v
		}
	}

	if statusMap, ok := root["smart_status"].(map[string]interface{}); ok {
		if passed, ok := statusMap["passed"].(bool); ok {
			metrics.SmartPassed = &passed
		}
	}

	if ataMap, ok := root["ata_smart_attributes"].(map[string]interface{}); ok {
		if table, ok := ataMap["table"].([]interface{}); ok {
			var mediaErrors int64
			var criticalWarnings int
			var ssdWearVal *int

			wearAttrs := map[int]bool{169: true, 177: true, 202: true, 231: true, 233: true}

			for _, rowIface := range table {
				row, ok := rowIface.(map[string]interface{})
				if !ok {
					continue
				}

				idF, ok1 := row["id"].(float64)
				rawMap, ok2 := row["raw"].(map[string]interface{})
				if !ok1 || !ok2 {
					continue
				}
				id := int(idF)

				rawValF, ok3 := rawMap["value"].(float64)
				if !ok3 {
					continue
				}
				rawVal := int64(rawValF)

				if id == 5 || id == 187 || id == 197 || id == 198 {
					mediaErrors += rawVal
				}

				if wf, ok := row["when_failed"].(string); ok && wf != "" {
					criticalWarnings++
				}

				if metrics.MediaType == "ssd" && wearAttrs[id] && ssdWearVal == nil {
					if valF, ok := row["value"].(float64); ok {
						v := int(valF)
						ssdWearVal = &v
					}
				}
			}

			metrics.MediaErrors = &mediaErrors
			metrics.CriticalWarnings = &criticalWarnings
			if metrics.MediaType == "ssd" && ssdWearVal != nil {
				metrics.LifeRemainingPct = ssdWearVal
			}
		}
	}

	return metrics
}

func prunePayload(root map[string]interface{}) map[string]interface{} {
	delete(root, "ata_smart_error_log")
	delete(root, "ata_smart_self_test_log")
	delete(root, "nvme_error_information_log")
	delete(root, "nvme_self_test_log")
	if smartctl, ok := root["smartctl"].(map[string]interface{}); ok {
		delete(smartctl, "messages")
	}
	return root
}

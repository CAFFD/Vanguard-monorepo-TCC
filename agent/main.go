package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// --------------------------------------------------
// CONFIGURAÇÃO
// --------------------------------------------------

func apiURL() string {
	if url := os.Getenv("VANGUARD_API_URL"); url != "" {
		return url
	}
	return "https://vanguard-monorepo-tcc.vercel.app"
}

func smartctlPath() (string, error) {
	path, err := exec.LookPath("smartctl")
	if err != nil {
		return "", fmt.Errorf("smartctl não encontrado no PATH: %w", err)
	}
	return path, nil
}

// --------------------------------------------------
// STRUCTS
// --------------------------------------------------

type ScannedDevice struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Protocol string `json:"protocol"`
}

type TelemetryError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type Telemetry struct {
	SchemaVersion int    `json:"schema_version"`
	Hostname      string `json:"hostname"`
	AgentVersion  string `json:"agent_version,omitempty"`

	CollectionStatus string          `json:"collection_status"`
	CollectionError  *TelemetryError `json:"collection_error,omitempty"`

	Protocol     string  `json:"protocol,omitempty"`
	MediaType    string  `json:"media_type,omitempty"`
	DeviceModel  *string `json:"device_model,omitempty"`
	DeviceSerial *string `json:"device_serial,omitempty"`

	DiskUsagePercent *int   `json:"disk_usage_percent,omitempty"`
	TemperatureC     *int   `json:"temperature_c,omitempty"`
	PowerOnHours     *int64 `json:"power_on_hours,omitempty"`
	LifeRemainingPct *int   `json:"life_remaining_pct,omitempty"`
	MediaErrors      *int64 `json:"media_errors,omitempty"`
	CriticalWarnings *int   `json:"critical_warnings,omitempty"`
	SmartPassed      *bool  `json:"smart_passed,omitempty"`

	RawPayload map[string]interface{} `json:"raw_payload,omitempty"`
}

// --------------------------------------------------
// DESCOBERTA DINÂMICA DE DISCO
// --------------------------------------------------

func descobrirDisco() (ScannedDevice, error) {
	binario, err := smartctlPath()
	if err != nil {
		return ScannedDevice{}, err
	}

	cmd := exec.Command(binario, "--scan-open", "-j")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, _ := cmd.CombinedOutput()

	var scanOutput struct {
		Devices []ScannedDevice `json:"devices"`
	}

	if err := json.Unmarshal(output, &scanOutput); err != nil {
		return ScannedDevice{}, fmt.Errorf("falha ao parsear output do --scan-open: %w (output: %s)", err, string(output))
	}

	if len(scanOutput.Devices) == 0 {
		return ScannedDevice{}, fmt.Errorf("nenhum disco detectado pelo smartctl --scan-open")
	}

	dev := scanOutput.Devices[0]
	fmt.Printf("[INFO] Disco detectado: %s (tipo: %s)\n", dev.Name, dev.Type)
	return dev, nil
}

// --------------------------------------------------
// COLETA — S.M.A.R.T.
// --------------------------------------------------

func coletarSmart(dev ScannedDevice) (ParsedSmart, *TelemetryError) {
	binario, err := smartctlPath()
	if err != nil {
		return ParsedSmart{}, &TelemetryError{Code: "SMARTCTL_NOT_FOUND", Message: err.Error()}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binario, "-a", "-j", "-d", dev.Type, dev.Name)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, err := cmd.CombinedOutput()

	if ctx.Err() == context.DeadlineExceeded {
		return ParsedSmart{}, &TelemetryError{Code: "TIMEOUT", Message: "smartctl travou (timeout de 60s)"}
	}

	var root map[string]interface{}
	if parseErr := json.Unmarshal(output, &root); parseErr != nil {
		return ParsedSmart{}, &TelemetryError{Code: "JSON_PARSE_ERROR", Message: parseErr.Error()}
	}

	if smartctl, ok := root["smartctl"].(map[string]interface{}); ok {
		if exitF, ok := smartctl["exit_status"].(float64); ok {
			exitCode := int(exitF)
			if (exitCode & 1) != 0 {
				return ParsedSmart{}, &TelemetryError{Code: "CMD_LINE_PARSE_ERROR", Message: "smartctl command line failed"}
			}
			if (exitCode & 2) != 0 {
				msg := "Device open failed or permission denied"
				if msgs, ok := smartctl["messages"].([]interface{}); ok && len(msgs) > 0 {
					if m, ok := msgs[0].(map[string]interface{}); ok {
						if s, ok := m["string"].(string); ok {
							msg = s
						}
					}
				}
				return ParsedSmart{}, &TelemetryError{Code: "PERMISSION_DENIED", Message: msg}
			}
		}
	}

	parsed, err := parseSmart(output)
	if err != nil {
		return ParsedSmart{}, &TelemetryError{Code: "JSON_PARSE_ERROR", Message: err.Error()}
	}

	return parsed, nil
}

// --------------------------------------------------
// COLETA — USO DO DISCO C:
// --------------------------------------------------

func obterUsoDisco() (int, error) {
	comando := `$d = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"; [math]::Round((($d.Size-$d.FreeSpace)/$d.Size)*100)`

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", comando)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("falha ao obter uso do disco: %w", err)
	}

	uso, err := strconv.Atoi(strings.TrimSpace(string(output)))
	if err != nil {
		return 0, fmt.Errorf("valor de disco inválido %q: %w", strings.TrimSpace(string(output)), err)
	}

	return uso, nil
}

// --------------------------------------------------
// COMUNICAÇÃO — POST /telemetry
// --------------------------------------------------

func enviarTelemetria(telemetria Telemetry) error {
	jsonData, err := json.Marshal(telemetria)
	if err != nil {
		return fmt.Errorf("falha ao serializar telemetria: %w", err)
	}

	url := apiURL() + "/telemetry"
	client := http.Client{Timeout: 30 * time.Second}

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(jsonData))
		if err != nil {
			return fmt.Errorf("falha ao criar request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("falha na requisição HTTP: %w", err)
			time.Sleep(2 * time.Second)
			continue
		}
		
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			lastErr = fmt.Errorf("API retornou status %d para %s: %s", resp.StatusCode, url, string(body))
			time.Sleep(2 * time.Second)
			continue
		}

		fmt.Printf("[OK] Telemetria enviada → %s (%s) [Status: %s]\n", url, resp.Status, telemetria.CollectionStatus)
		return nil
	}

	return lastErr
}

// --------------------------------------------------
// CICLO DE COLETA E ENVIO
// --------------------------------------------------

func executarCiclo(hostname string) {
	fmt.Println("[INFO] Iniciando ciclo de coleta...")

	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("[FATAL] Panic no ciclo: %v\n", r)
			telemetria := Telemetry{
				SchemaVersion:    2,
				AgentVersion:     "2.0.0",
				Hostname:         hostname,
				CollectionStatus: "failed",
				CollectionError:  &TelemetryError{Code: "INTERNAL_PANIC", Message: fmt.Sprintf("%v", r)},
			}
			enviarTelemetria(telemetria)
		}
	}()

	telemetria := Telemetry{
		SchemaVersion:    2,
		AgentVersion:     "2.0.0",
		Hostname:         hostname,
		CollectionStatus: "failed",
	}

	device, err := descobrirDisco()
	if err != nil {
		fmt.Printf("[ERRO] Descoberta de disco: %v\n", err)
		telemetria.CollectionError = &TelemetryError{Code: "NO_DEVICE", Message: err.Error()}
		enviarTelemetria(telemetria)
		return
	}

	parsed, telErr := coletarSmart(device)
	if telErr != nil {
		fmt.Printf("[ERRO] Coleta SMART (%s): code=%s message=%s\n", device.Name, telErr.Code, telErr.Message)
		telemetria.CollectionError = telErr
		enviarTelemetria(telemetria)
		return
	}

	telemetria.Protocol = parsed.Metrics.Protocol
	telemetria.MediaType = parsed.Metrics.MediaType
	telemetria.DeviceModel = parsed.Metrics.DeviceModel
	telemetria.DeviceSerial = parsed.Metrics.DeviceSerial
	telemetria.TemperatureC = parsed.Metrics.TemperatureC
	telemetria.PowerOnHours = parsed.Metrics.PowerOnHours
	telemetria.LifeRemainingPct = parsed.Metrics.LifeRemainingPct
	telemetria.MediaErrors = parsed.Metrics.MediaErrors
	telemetria.CriticalWarnings = parsed.Metrics.CriticalWarnings
	telemetria.SmartPassed = parsed.Metrics.SmartPassed
	telemetria.RawPayload = parsed.RawPayload

	diskUsage, err := obterUsoDisco()
	if err != nil {
		fmt.Printf("[ERRO] Uso do disco: %v\n", err)
		telemetria.CollectionStatus = "partial"
		telemetria.CollectionError = &TelemetryError{Code: "DISK_USAGE_FAILED", Message: err.Error()}
	} else {
		telemetria.DiskUsagePercent = &diskUsage
		telemetria.CollectionStatus = "ok"
	}

	if err := enviarTelemetria(telemetria); err != nil {
		fmt.Printf("[ERRO] Envio: %v\n", err)
	}
}

// --------------------------------------------------
// MAIN — DAEMON COM TICKER
// --------------------------------------------------

func sanitizeHostname(s string) string {
	replacer := strings.NewReplacer(
		"á", "a", "à", "a", "â", "a", "ã", "a",
		"é", "e", "è", "e", "ê", "e",
		"í", "i", "ï", "i",
		"ó", "o", "ô", "o", "õ", "o",
		"ú", "u",
		"ç", "c",
		"Á", "A", "À", "A", "Â", "A", "Ã", "A",
		"É", "E", "È", "E", "Ê", "E",
		"Í", "I", "Ï", "I",
		"Ó", "O", "Ô", "O", "Õ", "O",
		"Ú", "U",
		"Ç", "C",
	)
	return replacer.Replace(s)
}

func main() {
	rawHostname, err := os.Hostname()
	if err != nil {
		fmt.Printf("[FATAL] Não foi possível obter o hostname: %v\n", err)
		os.Exit(1)
	}
	hostname := sanitizeHostname(rawHostname)

	fmt.Printf("[INFO] Agente Vanguard iniciado | hostname=%s | api=%s\n", hostname, apiURL())

	executarCiclo(hostname)

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		executarCiclo(hostname)
	}
}

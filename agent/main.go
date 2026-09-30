package main

import (
	"bytes"
	"encoding/json"
	"fmt"
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

// apiURL lê a URL base da API da variável de ambiente VANGUARD_API_URL.
// Se não estiver definida, usa o valor padrão de produção.
func apiURL() string {
	if url := os.Getenv("VANGUARD_API_URL"); url != "" {
		return url
	}
	return "https://vanguard-monorepo-tcc.vercel.app"
}

// smartctlPath localiza o binário smartctl no PATH do sistema.
// Elimina o caminho hardcoded — funciona em qualquer máquina com smartmontools instalado.
func smartctlPath() (string, error) {
	path, err := exec.LookPath("smartctl")
	if err != nil {
		return "", fmt.Errorf("smartctl não encontrado no PATH: %w", err)
	}
	return path, nil
}

// --------------------------------------------------
// STRUCTS — S.M.A.R.T.
// --------------------------------------------------

// ScannedDevice representa uma entrada do `smartctl --scan-open -j`
type ScannedDevice struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Protocol string `json:"protocol"`
}

type SmartAttribute struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Raw  struct {
		Value int64 `json:"value"`
	} `json:"raw"`
}

type SmartData struct {
	ModelName    string `json:"model_name"`
	SerialNumber string `json:"serial_number"`

	SmartStatus struct {
		Passed bool `json:"passed"`
	} `json:"smart_status"`

	Temperature struct {
		Current int `json:"current"`
	} `json:"temperature"`

	PowerOnTime struct {
		Hours int64 `json:"hours"`
	} `json:"power_on_time"`

	Device struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"device"`

	AtaSmartAttributes struct {
		Table []SmartAttribute `json:"table"`
	} `json:"ata_smart_attributes"`
}

// --------------------------------------------------
// STRUCT — PAYLOAD ENVIADO À API
// --------------------------------------------------

type Telemetry struct {
	Hostname  string `json:"hostname"`
	DiskUsage int    `json:"disk_usage"`

	// Atributos S.M.A.R.T. exigidos pelo backend
	Smart5   int64 `json:"smart_5"`
	Smart187 int64 `json:"smart_187"`
	Smart188 int64 `json:"smart_188"`
	Smart197 int64 `json:"smart_197"`
	Smart198 int64 `json:"smart_198"`

	// Dump bruto salvo em raw_payload no banco (auditoria)
	RawPayload interface{} `json:"raw_payload"`
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

func buscarSmart(dados SmartData, id int) int64 {
	for _, atributo := range dados.AtaSmartAttributes.Table {
		if atributo.ID == id {
			return atributo.Raw.Value
		}
	}
	return 0
}

// --------------------------------------------------
// DESCOBERTA DINÂMICA DE DISCO
// --------------------------------------------------

// descobrirDisco executa `smartctl --scan-open -j` e retorna o nome
// do primeiro dispositivo encontrado (ex: "/dev/sda", "/dev/nvme0").
// Funciona com SATA, NVMe, SCSI e Windows sem qualquer if runtime.GOOS.
func descobrirDisco() (string, error) {
	binario, err := smartctlPath()
	if err != nil {
		return "", err
	}

	// exit code não-zero é esperado aqui — ignoramos, confiamos no JSON
	cmd := exec.Command(binario, "--scan-open", "-j")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, _ := cmd.CombinedOutput()

	var scanOutput struct {
		Devices []ScannedDevice `json:"devices"`
	}

	if err := json.Unmarshal(output, &scanOutput); err != nil {
		return "", fmt.Errorf("falha ao parsear output do --scan-open: %w (output: %s)", err, string(output))
	}

	if len(scanOutput.Devices) == 0 {
		return "", fmt.Errorf("nenhum disco detectado pelo smartctl --scan-open")
	}

	disco := scanOutput.Devices[0].Name
	fmt.Printf("[INFO] Disco detectado: %s (tipo: %s)\n", disco, scanOutput.Devices[0].Type)
	return disco, nil
}

// --------------------------------------------------
// COLETA — S.M.A.R.T.
// --------------------------------------------------

// coletarSmart recebe o dispositivo descoberto dinamicamente por descobrirDisco().
func coletarSmart(device string) (SmartData, error) {
	binario, err := smartctlPath()
	if err != nil {
		return SmartData{}, err
	}

	cmd := exec.Command(binario, "-a", "-j", device)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, err := cmd.CombinedOutput()

	// smartctl usa exit codes não-zero mesmo em leitura parcial bem-sucedida.
	// Confiamos no parse do JSON, não no exit code.
	var dados SmartData
	if parseErr := json.Unmarshal(output, &dados); parseErr != nil {
		return SmartData{}, fmt.Errorf("falha ao parsear JSON do smartctl para %s: %w", device, parseErr)
	}

	if err != nil {
		fmt.Printf("[WARN] smartctl saiu com código de erro para %s, mas JSON parseado: %v\n", device, err)
	}

	return dados, nil
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
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("falha ao criar request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Timeout generoso para cold start de funções serverless (Vercel)
	client := http.Client{Timeout: 30 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha na requisição HTTP: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("API retornou status %d para %s", resp.StatusCode, url)
	}

	fmt.Printf("[OK] Telemetria enviada → %s (%s)\n", url, resp.Status)
	return nil
}

// --------------------------------------------------
// CICLO DE COLETA E ENVIO
// --------------------------------------------------

func executarCiclo(hostname string) {
	fmt.Println("[INFO] Iniciando ciclo de coleta...")

	// Descoberta dinâmica: detecta SATA, NVMe, SCSI automaticamente
	device, err := descobrirDisco()
	if err != nil {
		fmt.Printf("[ERRO] Descoberta de disco: %v — ciclo abortado\n", err)
		return
	}

	dados, err := coletarSmart(device)
	if err != nil {
		fmt.Printf("[ERRO] Coleta SMART (%s): %v — ciclo abortado\n", device, err)
		return
	}

	diskUsage, err := obterUsoDisco()
	if err != nil {
		fmt.Printf("[ERRO] Uso do disco: %v — ciclo abortado\n", err)
		return
	}

	telemetria := Telemetry{
		Hostname:   hostname,
		DiskUsage:  diskUsage,
		Smart5:     buscarSmart(dados, 5),
		Smart187:   buscarSmart(dados, 187),
		Smart188:   buscarSmart(dados, 188),
		Smart197:   buscarSmart(dados, 197),
		Smart198:   buscarSmart(dados, 198),
		RawPayload: dados,
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

	// Executa imediatamente no boot sem esperar o primeiro tick
	executarCiclo(hostname)

	// Loop periódico a cada 5 minutos — sem vazamento de memória
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		executarCiclo(hostname)
	}
}


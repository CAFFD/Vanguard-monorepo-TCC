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
	"time"
)

// --------------------------------------------------
// SMARTCTL
// --------------------------------------------------

type SmartAttribute struct {
	ID   int    `json:"id"`
	Name string `json:"name"`

	Raw struct {
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
// JSON QUE SERÁ ENVIADO PARA O FASTIFY
// --------------------------------------------------

type Telemetry struct {
	Hostname string `json:"hostname"`

	DiskUsage int `json:"disk_usage"`

	Smart5   int64 `json:"smart_5"`
	Smart187 int64 `json:"smart_187"`
	Smart188 int64 `json:"smart_188"`
	Smart197 int64 `json:"smart_197"`
	Smart198 int64 `json:"smart_198"`
}

// --------------------------------------------------
// BUSCAR ATRIBUTO SMART
// --------------------------------------------------

func buscarSmart(
	dados SmartData,
	id int,
) int64 {

	for _, atributo := range dados.AtaSmartAttributes.Table {

		if atributo.ID == id {
			return atributo.Raw.Value
		}
	}

	return 0
}

// --------------------------------------------------
// COLETAR DADOS DO SMARTCTL
// --------------------------------------------------

func coletarSmart() (SmartData, error) {

	cmd := exec.Command(
		`C:\Users\DOGGY\bin\smartctl.exe`,
		"-a",
		"-j",
		"/dev/sda",
	)

	output, err :=
		cmd.CombinedOutput()

	if err != nil {

		fmt.Println(
			"AVISO SMARTCTL:",
			err,
		)
	}

	var dados SmartData

	err = json.Unmarshal(
		output,
		&dados,
	)

	if err != nil {
		return dados, err
	}

	return dados, nil
}

// --------------------------------------------------
// USO DO DISCO C:
// --------------------------------------------------

func obterUsoDisco() (int, error) {

	comando := `
$d = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'";
[math]::Round((($d.Size-$d.FreeSpace)/$d.Size)*100)
`

	cmd := exec.Command(
		"powershell",
		"-NoProfile",
		"-Command",
		comando,
	)

	output, err := cmd.Output()

	if err != nil {
		return 0, err
	}

	valor :=
		strings.TrimSpace(
			string(output),
		)

	uso, err :=
		strconv.Atoi(valor)

	if err != nil {
		return 0, err
	}

	return uso, nil
}

// --------------------------------------------------
//ENVIAR PARA FASTIFY
// --------------------------------------------------

func enviarTelemetria(
	telemetria Telemetry,
) error {

	jsonData, err :=
		json.Marshal(telemetria)

	if err != nil {
		return err
	}

	req, err :=
		http.NewRequest(
			http.MethodPost,
			"http://localhost:3000/telemetry",
			bytes.NewBuffer(jsonData),
		)

	if err != nil {
		return err
	}

	req.Header.Set(
		"Content-Type",
		"application/json",
	)

	client := http.Client{
		Timeout: 10 * time.Second,
	}

	response, err :=
		client.Do(req)

	if err != nil {
		return err
	}

	defer response.Body.Close()

	fmt.Println(
		"STATUS API:",
		response.Status,
	)

	if response.StatusCode < 200 ||
		response.StatusCode >= 300 {

		return fmt.Errorf(
			"API retornou status %d",
			response.StatusCode,
		)
	}

	return nil
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------

func main() {

	fmt.Println(
		"Iniciando coleta...",
	)

	hostname, err :=
		os.Hostname()

	if err != nil {

		fmt.Println(
			"Erro hostname:",
			err,
		)

		return
	}

	// 2 - Coletar SMART

	dados, err :=
		coletarSmart()

	if err != nil {

		fmt.Println(
			"Erro SMART:",
			err,
		)

		return
	}

	// 3 - Uso do disco

	diskUsage, err :=
		obterUsoDisco()

	if err != nil {

		fmt.Println(
			"Erro uso disco:",
			err,
		)

		return
	}

	// 4 - Criar estrutura para API

	telemetria := Telemetry{

		Hostname: hostname,

		DiskUsage: diskUsage,

		Smart5: buscarSmart(dados, 5),

		Smart187: buscarSmart(dados, 187),

		Smart188: buscarSmart(dados, 188),

		Smart197: buscarSmart(dados, 197),

		Smart198: buscarSmart(dados, 198),
	}

	jsonTeste, _ :=
		json.MarshalIndent(
			telemetria,
			"",
			"  ",
		)

	fmt.Println(
		string(jsonTeste),
	)

	// 5 - Enviar para API

	err =
		enviarTelemetria(
			telemetria,
		)

	if err != nil {

		fmt.Println(
			"Erro ao enviar:",
			err,
		)

		return
	}

	fmt.Println(
		"Telemetria enviada com sucesso!",
	)
}

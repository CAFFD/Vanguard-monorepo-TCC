# API de Telemetria (`/telemetry`)

Documentação de integração dos endpoints de Telemetria da API para consumo do frontend e monitoramento dos agentes.

## Base URL
```text
http://127.0.0.1:3000
```

---

## 1. Enviar Telemetria

Recebe, valida e persiste os dados brutos de telemetria coletados pelo agente Go na máquina do cliente.

- **URL:** `/telemetry`
- **Método:** `POST`
- **Content-Type:** `application/json`

### Payload Esperado (Body)

Todos os campos são obrigatórios e validados estritamente pelo schema Zod.

| Campo | Tipo | Descrição | Restrições |
| :--- | :--- | :--- | :--- |
| `hostname` | `string` | Nome da máquina/equipamento na rede | Não vazio (`min(1)`) |
| `disk_usage` | `number` | Porcentagem de uso do disco principal | Entre `0` e `100` |
| `smart_5` | `integer` | SMART 5 (Reallocated Sectors Count) | Inteiro não-negativo (`≥ 0`) |
| `smart_187` | `integer` | SMART 187 (Reported Uncorrectable Errors) | Inteiro não-negativo (`≥ 0`) |
| `smart_188` | `integer` | SMART 188 (Command Timeout) | Inteiro não-negativo (`≥ 0`) |
| `smart_197` | `integer` | SMART 197 (Current Pending Sector Count) | Inteiro não-negativo (`≥ 0`) |
| `smart_198` | `integer` | SMART 198 (Offline Uncorrectable Sector Count) | Inteiro não-negativo (`≥ 0`) |

#### Exemplo de Requisição:
```json
{
  "hostname": "PC-TI-001-MOD",
  "disk_usage": 52,
  "smart_5": 1,
  "smart_187": 2,
  "smart_188": 3,
  "smart_197": 4,
  "smart_198": 5
}
```

### Respostas

#### Sucesso — HTTP 200 OK
Retornado quando o payload é válido, o hostname é resolvido para exatamente um equipamento e o registro é persistido na tabela `telemetry_history`.

```json
{
  "success": true,
  "message": "Telemetria recebida com sucesso"
}
```

#### Erro de Validação — HTTP 400 Bad Request
Retornado quando qualquer campo estiver ausente, com tipo incompatível ou fora dos limites permitidos.

```json
{
  "success": false,
  "message": "Dados de telemetria inválidos",
  "errors": [
    {
      "field": "hostname",
      "message": "Invalid input: expected string, received undefined"
    }
  ]
}
```

#### Equipamento Não Encontrado — HTTP 404 Not Found
Retornado quando não existe nenhum equipamento cadastrado no banco com o `hostname` informado.

```json
{
  "success": false,
  "message": "Nenhum equipamento encontrado para o hostname: PC-INEXISTENTE"
}
```

#### Hostname Ambíguo — HTTP 409 Conflict
Retornado quando mais de um equipamento possui o mesmo `hostname` cadastrado, impedindo a vinculação automática.

```json
{
  "success": false,
  "message": "Mais de um equipamento encontrado para o hostname: PC-DUPLICADO"
}
```

---

## 2. Histórico de Telemetria por Equipamento

Retorna o histórico de telemetrias gravadas para um equipamento específico.

- **URL:** `/telemetry/:equipamento_id`
- **Método:** `GET`
- **Ordenação:** `created_at DESC` (do registro mais recente para o mais antigo)

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `equipamento_id` | `string` | Identificador único do equipamento (ex: `eq-pc-001`) |

### Respostas

#### Sucesso com Dados — HTTP 200 OK
Retorna uma lista JSON contendo todas as entradas de histórico persistidas para o equipamento.

> **Nota:** O campo `disk_usage_percent` é retornado como `string` numérica (ex: `"52"`) devido ao tipo `numeric` do PostgreSQL.

```json
[
  {
    "id": "0b6b9aa3-845e-4b31-92d8-1add073936fc",
    "created_at": "2026-09-13T20:39:39.190Z",
    "disk_usage_percent": "52",
    "smart_5": 1,
    "equipment_id": "eq-pc-001",
    "smart_187": 2,
    "smart_188": 3,
    "smart_197": 4,
    "smart_198": 5,
    "raw_payload": {
      "hostname": "PC-TI-001-MOD",
      "disk_usage": 52,
      "smart_5": 1,
      "smart_187": 2,
      "smart_188": 3,
      "smart_197": 4,
      "smart_198": 5
    }
  }
]
```

#### Sucesso sem Histórico — HTTP 200 OK
Retornado quando o equipamento não possui registros de telemetria no histórico.

```json
[]
```

---

## 3. Status Agregado da Telemetria

Retorna a contagem agregada da situação operacional de todos os equipamentos cadastrados no sistema.

- **URL:** `/telemetry/status`
- **Método:** `GET`

### Resposta — HTTP 200 OK

```json
{
  "normal": 0,
  "atencao": 1,
  "critico": 0,
  "offline": 2
}
```

### Contrato de Dados

```json
{
  "normal": number,
  "atencao": number,
  "critico": number,
  "offline": number
}
```

### Regras de Negócio e Classificação

Cada equipamento cadastrado na tabela `equipments` é avaliado individualmente e contabilizado em **apenas uma categoria**, seguindo estritamente a ordem de precedência operacional:

```text
1. OFFLINE ➔ 2. CRÍTICO ➔ 3. ATENÇÃO ➔ 4. NORMAL
```

1. **`offline` (Sem Comunicação):**
   - O equipamento não possui nenhum registro de telemetria; **OU**
   - A telemetria mais recente foi recebida há **mais de 2 horas** (`agora - última_leitura > 2 horas`).

2. **`critico`:**
   - O equipamento possui histórico de pelo menos 2 telemetrias; **E**
   - O valor atual de `smart_197` é maior que o `smart_197` da telemetria imediatamente anterior; **E**
   - O valor atual de `smart_198` é maior que o `smart_198` da telemetria imediatamente anterior.
   *(Aumento simultâneo de setores pendentes e incorrigíveis).*

3. **`atencao`:**
   - O uso de disco `disk_usage_percent` é maior que `90%`; **OU**
   - O valor atual de `smart_197` é maior que `0` (`smart_197 > 0`).

4. **`normal`:**
   - Equipamento com comunicação ativa nas últimas 2 horas que não se enquadra nos critérios de `critico` ou `atencao`.

# Endpoints de Equipamentos (`/equipments`)

Documentação de integração para o frontend dos endpoints de Equipamentos da API.

---

## 1. Criar Equipamento

Cadastra um novo equipamento no sistema.

- **URL:** `/equipments`
- **Método:** `POST`
- **Content-Type:** `application/json`

### Payload Esperado (Body)

Todos os campos são obrigatórios e devem ser strings não vazias.

| Campo | Tipo | Descrição | Restrições |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Identificador único do equipamento | Chave primária |
| `sector_id` | `string` | ID do setor ao qual o equipamento pertence | Deve existir na tabela `sectors` (FK) |
| `mac_address` | `string` | Endereço MAC físico da placa de rede | Único no sistema (UNIQUE) |
| `patrimony_tag` | `string` | Tag ou plaqueta de patrimônio | Único no sistema (UNIQUE) |
| `hostname` | `string` | Nome da máquina na rede | Não é obrigatório ser único |
| `health_status` | `string` | Estado de saúde operacional do equipamento | String descritiva (ex: `normal`, `warning`) |

#### Exemplo de Requisição:
```json
{
  "id": "eq-doc-001",
  "sector_id": "sec-ti-01",
  "mac_address": "AA:BB:CC:DD:EE:91",
  "patrimony_tag": "PAT-DOC-001",
  "hostname": "PC-DOC-001",
  "health_status": "normal"
}
```

### Respostas

#### Sucesso — HTTP 201 Created
```json
{
  "success": true,
  "data": {
    "id": "eq-doc-001",
    "sector_id": "sec-ti-01",
    "mac_address": "AA:BB:CC:DD:EE:91",
    "patrimony_tag": "PAT-DOC-001",
    "hostname": "PC-DOC-001",
    "health_status": "normal"
  }
}
```

#### Erro de Validação — HTTP 400 Bad Request
Retornado quando qualquer um dos campos obrigatórios estiver ausente ou for uma string vazia.

```json
{
  "success": false,
  "message": "Dados de equipamento inválidos",
  "errors": [
    {
      "field": "hostname",
      "message": "Invalid input: expected string, received undefined"
    }
  ]
}
```

---

## 2. Listar Equipamentos

Retorna todos os equipamentos cadastrados.

- **URL:** `/equipments`
- **Método:** `GET`
- **Headers:** Nenhum específico

### Resposta

#### Sucesso — HTTP 200 OK
Retorna uma lista JSON direta com todos os registros de equipamentos.

```json
[
  {
    "id": "eq-pc-001",
    "sector_id": "sec-ti-01",
    "mac_address": "AA:BB:CC:DD:EE:01",
    "patrimony_tag": "PAT-001",
    "hostname": "PC-TI-001-MOD",
    "health_status": "warning"
  },
  {
    "id": "eq-pc-002",
    "sector_id": "sec-rh-01",
    "mac_address": "AA:BB:CC:DD:EE:02",
    "patrimony_tag": "PAT-002",
    "hostname": "PC-RH-001-UPDATED",
    "health_status": "good"
  },
  {
    "id": "eq-doc-001",
    "sector_id": "sec-ti-01",
    "mac_address": "AA:BB:CC:DD:EE:91",
    "patrimony_tag": "PAT-DOC-001",
    "hostname": "PC-DOC-001-UPDATED",
    "health_status": "normal"
  }
]
```

---

## 3. Atualizar Equipamento

Atualiza os dados de um equipamento existente identificado pelo parâmetro `:id` na URL.

- **URL:** `/equipments/:id`
- **Método:** `PUT`
- **Content-Type:** `application/json`

> **Importante:** O `id` do equipamento é fornecido obrigatoriamente na URL e **não pode** ser alterado através do corpo da requisição.

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `string` | Identificador do equipamento a ser atualizado |

### Payload Esperado (Body)

Todos os campos são obrigatórios e devem ser strings não vazias.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `sector_id` | `string` | ID do setor ao qual o equipamento pertence |
| `mac_address` | `string` | Endereço MAC físico |
| `patrimony_tag` | `string` | Plaqueta de patrimônio |
| `hostname` | `string` | Nome da máquina |
| `health_status` | `string` | Estado operacional de saúde |

#### Exemplo de Requisição:
`PUT /equipments/eq-doc-001`
```json
{
  "sector_id": "sec-ti-01",
  "mac_address": "AA:BB:CC:DD:EE:91",
  "patrimony_tag": "PAT-DOC-001",
  "hostname": "PC-DOC-001-UPDATED",
  "health_status": "normal"
}
```

### Respostas

#### Sucesso — HTTP 200 OK
```json
{
  "success": true,
  "data": {
    "id": "eq-doc-001",
    "sector_id": "sec-ti-01",
    "mac_address": "AA:BB:CC:DD:EE:91",
    "patrimony_tag": "PAT-DOC-001",
    "hostname": "PC-DOC-001-UPDATED",
    "health_status": "normal"
  }
}
```

#### Erro de Validação — HTTP 400 Bad Request
Retornado quando qualquer campo do body estiver ausente ou com string vazia.

```json
{
  "success": false,
  "message": "Dados de equipamento inválidos",
  "errors": [
    {
      "field": "health_status",
      "message": "health_status é obrigatório"
    }
  ]
}
```

#### Equipamento Não Encontrado — HTTP 404 Not Found
Retornado caso o ID fornecido na URL não corresponda a nenhum equipamento no banco.

```json
{
  "success": false,
  "message": "Equipamento não encontrado"
}
```

# Endpoints de Setores (`/sectors`)

Documentação de integração para o frontend dos endpoints de Setores da API.

---

## 1. Criar Setor

Cria um novo setor no sistema.

- **URL:** `/sectors`
- **Método:** `POST`
- **Content-Type:** `application/json`

### Payload Esperado (Body)

Todos os campos são obrigatórios e devem ser strings não vazias.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único do setor |
| `name` | `string` | Nome do setor |
| `description` | `string` | Descrição das atividades do setor |

#### Exemplo de Requisição:
```json
{
  "id": "sec-doc-01",
  "name": "Setor Documentação",
  "description": "Setor criado para validação da API"
}
```

### Respostas

#### Sucesso — HTTP 201 Created
```json
{
  "success": true,
  "data": {
    "id": "sec-doc-01",
    "name": "Setor Documentação",
    "description": "Setor criado para validação da API"
  }
}
```

#### Erro de Validação — HTTP 400 Bad Request
Retornado caso algum campo obrigatório não seja informado ou seja uma string vazia.

```json
{
  "success": false,
  "message": "Dados de setor inválidos",
  "errors": [
    {
      "field": "name",
      "message": "Invalid input: expected string, received undefined"
    }
  ]
}
```

---

## 2. Listar Setores

Retorna a lista completa de setores cadastrados.

- **URL:** `/sectors`
- **Método:** `GET`
- **Headers:** Nenhum específico

### Resposta

#### Sucesso — HTTP 200 OK
Retorna uma lista JSON direta contendo os setores cadastrados.

```json
[
  {
    "id": "sec-ti-01",
    "name": "Tecnologia da Informação",
    "description": "Setor responsável pela infraestrutura e suporte de TI"
  },
  {
    "id": "sec-rh-01",
    "name": "Recursos Humanos",
    "description": "Setor de gestão de pessoas"
  },
  {
    "id": "sec-doc-01",
    "name": "Setor Documentação",
    "description": "Setor criado para validação da API"
  }
]
```

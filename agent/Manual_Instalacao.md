# Manual de Instalação do Agente Vanguard

Este é um guia passo a passo, feito para que qualquer pessoa consiga configurar um novo computador para ser monitorado pelo sistema Vanguard. Siga as instruções na ordem abaixo.

---

## 🛠️ Passo 1: Descobrir o "Nome" do Computador (Hostname)
O sistema precisa saber exatamente o nome da máquina para vinculá-la aos dados.

1. No computador novo, clique no menu **Iniciar** do Windows.
2. Digite **PowerShell** e aperte **Enter**.
3. Na tela azul que abrir, digite a palavra `hostname` e aperte **Enter**.
4. Anote o nome que apareceu na tela (exemplo: `DESKTOP-ABC1234`). Você vai precisar dele no próximo passo.

---

## 🌐 Passo 2: Cadastrar o PC no Sistema Vanguard
1. Pelo seu celular ou outro computador, acesse a plataforma web da Vanguard (a página de Produção).
2. Vá até a aba **Cadastrar equipamento**.
3. Preencha os dados:
   - **Número de patrimônio:** Invente ou coloque o número de controle interno (ex: `1010`).
   - **Hostname:** Digite exatamente o nome que você anotou no Passo 1 (ex: `DESKTOP-ABC1234`).
   - **Endereço MAC:** Pode colocar `00:00:00:00:00:00` por enquanto.
   - **Setor responsável:** Escolha o setor em que esse computador vai ficar.
4. Clique em **Cadastrar**.

---

## 💾 Passo 3: Instalar o leitor de Disco
O agente precisa de um pequeno programa gratuito para conseguir ler a saúde do HD/SSD.

1. No computador novo, abra o navegador e acesse este link direto para baixar o programa:
   👉 **[Clique aqui para baixar o Smartmontools](https://sourceforge.net/projects/smartmontools/files/smartmontools/7.5/smartmontools-7.5-1.win32-setup.exe/download)**
2. Espere os 5 segundos do site e o download do arquivo `smartmontools-7.5-1.win32-setup.exe` vai começar.
3. Abra esse arquivo baixado.
4. Vá clicando em **Next (Avançar)** em todas as telas, marque a caixa **"Add smartmontools to system PATH"** (se aparecer), e clique em **Install**.
5. Quando terminar, clique em **Finish**.

---

## 🤖 Passo 4: Colocar o Agente no Computador
1. Pegue o arquivo `vanguard-agent.exe` (pelo pendrive ou baixando do seu drive) e passe para o computador novo.
2. Abra o disco **C:** do computador, entre na pasta **Arquivos de Programas** (ou Program Files).
3. Crie uma pasta lá dentro chamada **Vanguard** e jogue o arquivo `vanguard-agent.exe` dentro dela.
   - O caminho final tem que ficar exatamente assim: `C:\Program Files\Vanguard\vanguard-agent.exe`

---

## 🚀 Passo 5: Fazer o agente rodar invisível e para sempre
Agora vamos dizer para o Windows ligar o agente sozinho, de forma invisível, toda vez que o PC ligar.

1. Ainda naquela tela azul do **PowerShell como Administrador** (ou abra uma nova se fechou), copie *todo o bloco de texto abaixo* (junto), cole na tela e aperte **Enter**:

```powershell
cmd.exe /c 'schtasks /create /tn "VanguardAgent" /tr "\"C:\Program Files\Vanguard\vanguard-agent.exe\"" /sc onstart /ru SYSTEM /rl HIGHEST /F'
```

2. Se ele responder **"Êxito: a tarefa agendada foi criada"**, **deu tudo certo!**
3. Reinicie o computador.

**🎉 Fim!** Assim que o PC ligar, o agente já vai começar a trabalhar invisível e enviar os dados do HD a cada 5 minutos lá para o painel da sua plataforma Web.

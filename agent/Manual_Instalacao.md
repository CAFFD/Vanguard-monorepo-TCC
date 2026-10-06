# Manual de Instalação Automática do Agente Vanguard

Este é um guia passo a passo, feito para que qualquer pessoa consiga configurar um novo computador para ser monitorado pelo sistema Vanguard de forma rápida e silenciosa.

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

## 💾 Passo 3: Instalar o leitor de Disco (Pré-requisito)
O agente precisa de um pequeno programa gratuito para conseguir ler a saúde do HD/SSD/NVMe na camada de hardware.

1. No computador novo, abra o navegador e acesse este link direto para baixar o programa:
   👉 **[Clique aqui para baixar o Smartmontools](https://sourceforge.net/projects/smartmontools/files/smartmontools/7.5/smartmontools-7.5-1.win32-setup.exe/download)**
2. Espere os 5 segundos do site e o download do arquivo `smartmontools-7.5-1.win32-setup.exe` vai começar.
3. Abra esse arquivo baixado.
4. Vá clicando em **Next (Avançar)** em todas as telas, marque a caixa **"Add smartmontools to system PATH"** (isso é muito importante), e clique em **Install**.
5. Quando terminar, clique em **Finish**.

---

## 🚀 Passo 4: Instalação Automatizada do Agente
Graças ao novo script de instalação corporativa, colocar o agente para rodar invisível no plano de fundo é questão de dois cliques.

1. Insira o pendrive (ou acesse a pasta da rede) que contém os dois arquivos do Agente Vanguard:
   - `vanguard-agent.exe`
   - `install.ps1`
2. Copie essa pasta para a **Área de Trabalho** do computador (ou qualquer lugar de fácil acesso).
3. Entre na pasta copiada.
4. Clique com o **botão direito do mouse** sobre o arquivo **`install.ps1`** e selecione **Executar com o PowerShell**.
5. Se o Windows perguntar se você deseja permitir que o aplicativo faça alterações (UAC), clique em **Sim**.
6. Uma tela azul ou preta abrirá rapidamente executando a instalação.
   - O script vai copiar o agente automaticamente para uma pasta oculta no disco `C:\Vanguard` e programar o Windows para iniciá-lo invisível sempre que a máquina for ligada (com privilégios SYSTEM).
   - Se você vir as mensagens em verde dizendo `[OK]`, a instalação foi um sucesso!

---

## ✅ Passo 5: Validação Final
Não é necessário reiniciar o computador. O script `install.ps1` já liga o Agente na hora para enviar o primeiro pacote de dados!

1. Para ter certeza de que está funcionando, aperte `Ctrl + Shift + Esc` para abrir o **Gerenciador de Tarefas**.
2. Vá até a aba **Detalhes**.
3. Procure por `vanguard-agent.exe` na lista. Se ele estiver lá consumindo quase 0% de CPU, **parabéns!** O computador já está enviando telemetria a cada 5 minutos para o seu painel na nuvem.

**🎉 Fim! Pode fechar tudo e ir para a próxima máquina.**

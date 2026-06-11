# projeto-push-notification

Projeto de demonstração de push notification (simples), com Back-End em C# (ASP.NET Core) e um Front-End estático para enviar e receber mensagens.

## O que é este projeto

É uma aplicação de exemplo que demonstra duas formas de entrega de mensagens para "dispositivos":
- Fila em memória (servidor guarda mensagens por ID de dispositivo).
- Canal em tempo real via SignalR (hub `/notificacaoHub`) — os dispositivos podem se registrar em um grupo.

O objetivo é servir como um protótipo simples para entender a integração entre um endpoint REST, uma fila leve em memória e clientes SignalR.

## Como funciona (resumo técnico)

- Backend: em `PushNotificationBackEnd` (ASP.NET Core).
	- Expõe endpoints REST em `api/mensagem` (ver `MensagemController.cs`).
	- Possui um `NotificacaoHub` em `/notificacaoHub` para clientes SignalR.
	- `FilaMensagensService` é um singleton em memória que guarda uma fila de mensagens por `IdDispositivo`.
	- O projeto habilita CORS para facilitar testes locais (ver `Program.cs` e `Properties/launchSettings.json`).

- Frontend: em `PushNotificationFrontEnd`.
	- `index.html` é um painel para adicionar dispositivos e enviar mensagens.
	- `device.html` + `device.js` simulam um dispositivo que se conecta ao hub SignalR e também faz polling ao endpoint REST `/api/mensagem/obter` a cada 10s.
	- `app.js` no painel faz `POST /api/mensagem/enviar` para colocar mensagens na fila.

Observação importante: no código atual o `MensagemController` adiciona a mensagem na fila em memória. Não há, por padrão, um envio automático via SignalR dentro do controller — o dispositivo pode receber mensagens por polling (GET `/api/mensagem/obter`) ou você pode estender o controller para enviar instantaneamente via `IHubContext<NotificacaoHub>` (veja seção "Push em tempo real" abaixo).

## Estrutura do repositório

- `PushNotificationBackEnd/` — código C# (API + SignalR + serviço de fila em memória)
- `PushNotificationFrontEnd/` — frontend estático (painel + simulador de dispositivo)

## Requisitos

- .NET SDK 10 (compatível com `net10.0` usado no projeto).
- Navegador moderno para o front-end.
- Para servir os arquivos estáticos localmente você pode usar `python -m http.server`, `npx serve` ou abrir diretamente os arquivos (recomenda-se um servidor HTTP para evitar problemas de origem).

## Como rodar

1) Backend (API + SignalR)

```bash
cd PushNotificationBackEnd
dotnet restore
dotnet run
```

Por padrão o projeto de desenvolvimento usa `http://localhost:5069` (ver `Properties/launchSettings.json`).

2) Frontend (painel e simulador)

Opção A — servir com Python (recomendado):

```bash
cd PushNotificationFrontEnd
python -m http.server 8000
# abrir http://localhost:8000/index.html
```

Opção B — usar um servidor Node rápido (se tiver `npx`):

```bash
cd PushNotificationFrontEnd
npx serve . -l 8000
# abrir http://localhost:8000/index.html
```

Opção C — abrir `PushNotificationFrontEnd/index.html` direto no navegador (pode funcionar localmente, mas usar um servidor HTTP evita problemas de origem/CORS).

## Testes rápidos / Exemplos

- Enviar uma mensagem (substitua `device-1` pelo id desejado):

```bash
curl -X POST "http://localhost:5069/api/mensagem/enviar" \
	-H "Content-Type: application/json" \
	-d '{"IdDispositivo":"device-1","Mensagem":"Olá do teste"}'
```

- Ler (obter) próxima mensagem para um dispositivo (polling):

```bash
curl "http://localhost:5069/api/mensagem/obter?IdDispositivo=device-1"
```

No front-end: use o painel (`index.html`) para adicionar um dispositivo e abrir um simulador (`device.html`). O simulador conecta ao hub SignalR e também faz polling a cada 10s. Quando a API recebe uma mensagem para um `IdDispositivo`, ela é colocada na fila em memória e o simulador a retorna no próximo polling (ou se você implementar envio em tempo real, será recebida imediatamente).

## Push em tempo real (opcional)

Se você quiser que o envio seja imediato via SignalR quando o `POST /api/mensagem/enviar` for chamado, injete `IHubContext<NotificacaoHub>` no `MensagemController` e envie para o grupo do dispositivo:

```csharp
private readonly IHubContext<NotificacaoHub> _hubContext;

// no construtor: (IHubContext<NotificacaoHub> hubContext, FilaMensagensService fila)
_hubContext = hubContext;

// depois de salvar na fila:
await _hubContext.Clients.Group(request.IdDispositivo).SendAsync("ReceberMensagem", request.Mensagem);
```

Isso garante que clientes conectados recebessem a mensagem imediatamente (via evento `ReceberMensagem`) e, ao mesmo tempo, você pode manter a fila para dispositivos offline.

## Observações

- A fila é em memória: reiniciar o servidor apaga todas as mensagens. Para produção, use uma fila persistente (Redis, banco, RabbitMQ etc.).
- O propósito deste repositório é educacional/experimental — código simples para facilitar entendimento e prototipagem.
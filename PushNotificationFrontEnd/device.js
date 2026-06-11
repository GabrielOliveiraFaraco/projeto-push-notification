(function(){
  const backendUrlInput = document.getElementById('backendUrl');
  const deviceIdInput = document.getElementById('deviceId');
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const messagesList = document.getElementById('messages');
  const timerDisplay = document.getElementById('pollTimer');

  let connection = null;
  let pollIntervalId = null;
  let pollCountdown = 10; // seconds
  let backendBase = null;
  let currentDeviceId = null;

  // read query params to auto-fill backend and device id if present
  (function readQueryParams(){
    try{
      const params = new URLSearchParams(window.location.search);
      const b = params.get('backend');
      const id = params.get('id');
      if (b) { backendUrlInput.value = decodeURIComponent(b); backendBase = decodeURIComponent(b).replace(/\/+$/,''); }
      if (id) { deviceIdInput.value = decodeURIComponent(id); }
    }catch(e){ /* ignore */ }
  })();

  function addMessage(text){
    const li = document.createElement('li');
    li.textContent = text;
    messagesList.prepend(li);
  }

  connectBtn.addEventListener('click', async ()=>{
    const backend = backendUrlInput.value.trim().replace(/\/+$/,'');
    const deviceId = deviceIdInput.value.trim();
    if(!backend || !deviceId){ alert('Informe backend e device id'); return; }

    // Para desenvolvimento local: tentar forçar WebSockets com skipNegotiation
    // Isso evita falhas de fetch na chamada /negotiate em alguns ambientes.
    const isLocalHost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(backend);
    if (isLocalHost) {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${backend}/notificacaoHub`, { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
        .withAutomaticReconnect()
        .build();
    } else {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${backend}/notificacaoHub`)
        .withAutomaticReconnect()
        .build();
    }

    connection.on('ReceberMensagem', (mensagem)=>{ addMessage(mensagem); });

    try{
      await connection.start();
      await connection.invoke('RegistrarDispositivo', deviceId);
      addMessage('Conectado como ' + deviceId);
      connectBtn.disabled = true;
      disconnectBtn.disabled = false;

      // ensure polling uses the backend and device id from the UI
      backendBase = backend;
      currentDeviceId = deviceId;
      startPolling();
    }catch(err){
      console.error(err);
      alert('Erro ao conectar: ' + err);
    }
  });

  disconnectBtn.addEventListener('click', async ()=>{
    if(!connection) return;
    try{ await connection.stop(); addMessage('Desconectado'); connectBtn.disabled = false; disconnectBtn.disabled = true; }
    catch(err){ console.error(err); }
    stopPolling();
  });

  // Polling: checa a cada 10s se há mensagem para este dispositivo via endpoint REST
  async function checkMessagesOnce() {
    if (!backendBase || !currentDeviceId) return;
    try {
      const res = await fetch(`${backendBase}/api/mensagem/obter?IdDispositivo=${encodeURIComponent(currentDeviceId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.mensagem) {
        addMessage(data.mensagem);
      }
    } catch (e) {
      console.error('Erro ao checar mensagens:', e);
    }
  }

  function startPolling() {
    stopPolling();
    pollCountdown = 10;
    if (timerDisplay) timerDisplay.textContent = `Próxima verificação em ${pollCountdown}s`;
    pollIntervalId = setInterval(async () => {
      pollCountdown--;
      if (timerDisplay) timerDisplay.textContent = `Próxima verificação em ${pollCountdown}s`;
      if (pollCountdown <= 0) {
        await checkMessagesOnce();
        pollCountdown = 10;
      }
    }, 1000);
  }

  function stopPolling() {
    if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
    if (timerDisplay) timerDisplay.textContent = '';
  }

})();

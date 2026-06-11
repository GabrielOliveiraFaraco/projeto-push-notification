(function () {
  const backendUrlInput = document.getElementById('backendUrl');
  const newDeviceIdInput = document.getElementById('newDeviceId');
  const addDeviceBtn = document.getElementById('addDeviceBtn');
  const createSimulatorBtn = document.getElementById('createSimulatorBtn');
  const devicesList = document.getElementById('devicesList');
  const sendBtn = document.getElementById('sendBtn');
  const messagesList = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');

  let devices = []; // { id: string, selected: bool }
  let selectedDeviceId = null;

  function log(text) {
    const li = document.createElement('li');
    li.textContent = text;
    messagesList.prepend(li);
  }

  function renderDevices() {
    devicesList.innerHTML = '';
    devices.forEach(d => {
      const li = document.createElement('li');
      li.className = 'device-item';
      li.innerHTML = `<span class="device-id">${d.id}</span> `;
      const selectBtn = document.createElement('button');
      selectBtn.textContent = d.id === selectedDeviceId ? 'Selecionado' : 'Selecionar';
      selectBtn.disabled = d.id === selectedDeviceId;
      selectBtn.addEventListener('click', () => { selectedDeviceId = d.id; sendBtn.disabled = false; renderDevices(); log('Selecionado ' + d.id); });
      const openBtn = document.createElement('button');
      openBtn.textContent = 'Abrir simulador';
      openBtn.addEventListener('click', () => { window.open(`device.html?backend=${encodeURIComponent(backendUrlInput.value)}&id=${encodeURIComponent(d.id)}`, '_blank'); });
      li.appendChild(selectBtn);
      li.appendChild(openBtn);
      devicesList.appendChild(li);
    });
  }

  function addDevice(id) {
    if (!id) id = 'device-' + Math.floor(Math.random() * 10000);
    if (devices.some(d => d.id === id)) { log('Dispositivo já existe: ' + id); return; }
    devices.push({ id });
    renderDevices();
    log('Dispositivo adicionado: ' + id);
  }

  addDeviceBtn.addEventListener('click', () => { addDevice(newDeviceIdInput.value.trim()); newDeviceIdInput.value = ''; });

  createSimulatorBtn.addEventListener('click', () => {
    const id = 'sim-' + Math.floor(Math.random() * 10000);
    addDevice(id);
    // open a new window with device.html and auto-connect parameters
    const backend = encodeURIComponent(backendUrlInput.value);
    window.open(`device.html?backend=${backend}&id=${encodeURIComponent(id)}`, '_blank');
  });

  async function sendMessage() {
    const backend = backendUrlInput.value.trim().replace(/\/+$/, '');
    const mensagem = messageInput.value.trim();
    if (!backend || !selectedDeviceId || !mensagem) { alert('Preencha Backend, selecione um dispositivo e escreva uma mensagem.'); return; }

    try {
      const res = await fetch(`${backend}/api/mensagem/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IdDispositivo: selectedDeviceId, Mensagem: mensagem })
      });
      if (!res.ok) { const text = await res.text(); throw new Error(text || res.status); }
      log(`Enviado para ${selectedDeviceId}: ${mensagem}`);
      messageInput.value = '';
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar mensagem: ' + err);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') sendMessage(); });

  // on load: maybe add a sample device
  addDevice('device-1');
  addDevice('device-2');
  renderDevices();

})();

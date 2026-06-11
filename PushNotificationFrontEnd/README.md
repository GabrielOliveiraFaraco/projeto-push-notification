# PushNotification — Front End

Breve front-end em HTML/CSS/JS para testar o backend de Push Notification.

Pré-requisitos
- .NET SDK para executar o backend
- Navegador moderno
- (Opcional) Python para servir arquivos estáticos ou usar a extensão Live Server do VS Code

Executando o backend

1. Abra um terminal na pasta do backend:

```powershell
cd PushNotificationBackEnd
dotnet run
```

Por padrão o backend fica disponível em `https://localhost:7226` e `http://localhost:5069`.

Servindo o front-end

Opcional A — servidor HTTP simples com Python (recomendado):

```powershell
cd PushNotificationFrontEnd
python -m http.server 5500
# Abra http://localhost:5500 no navegador
```

Opcional B — abrir o arquivo `index.html` diretamente
- Em alguns navegadores isso pode funcionar, mas é melhor servir via HTTP para evitar problemas de CORS / origem nula.

Uso

1. Abra a página do front-end no navegador.
2. Ajuste o campo "Backend URL" se necessário (ex: `https://localhost:7226` ou `http://localhost:5069`).
3. Informe um `Device ID` (por exemplo `device-1`) e clique em `Conectar`.
4. No campo `Enviar Mensagem`, escreva uma mensagem e clique em `Enviar`.
5. Se o backend estiver rodando, e o dispositivo estiver conectado, a mensagem aparecerá em "Mensagens recebidas".

Observações
- Se usar HTTPS com certificado de desenvolvimento (self-signed), aceite o aviso do navegador para permitir a conexão.
- O backend já tem CORS habilitado para desenvolvimento.

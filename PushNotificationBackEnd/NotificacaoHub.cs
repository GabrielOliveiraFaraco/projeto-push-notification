// É aqui que os dispositivos se conectam e se identificam (ex: "Meu ID é X").

using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

public class NotificacaoHub : Hub
{
    public async Task RegistrarDispositivo(string idDispositivo)
    {
        // Adiciona o dispositivo a um grupo com base no ID do dispositivo
        await Groups.AddToGroupAsync(Context.ConnectionId, idDispositivo);
    }
}

// Um serviço em memória (Singleton) que guarda o ConcurrentDictionary com as filas de mensagens de cada ID.

public class FilaMensagensService
{
    private readonly ConcurrentDictionary<string, Queue<string>> _filasMensagens;

    public FilaMensagensService()
    {
        _filasMensagens = new ConcurrentDictionary<string, Queue<string>>();
    }

    public void AdicionarMensagem(string idDispositivo, string mensagem)
    {
        var fila = _filasMensagens.GetOrAdd(idDispositivo, _ => new Queue<string>());
        lock (fila)
        {
            fila.Enqueue(mensagem);
        }
    }

    public Queue<string> ObterFilaMensagens(string idDispositivo)
    {
        return _filasMensagens.GetOrAdd(idDispositivo, _ => new Queue<string>());
    }

    /// <summary>
    /// Tenta obter (desenfileirar) a próxima mensagem para o dispositivo.
    /// Retorna true e a mensagem quando existir; caso contrário retorna false.
    /// </summary>
    public bool TentarObterMensagem(string idDispositivo, out string? mensagem)
    {
        var fila = _filasMensagens.GetOrAdd(idDispositivo, _ => new Queue<string>());
        lock (fila)
        {
            if (fila.Count > 0)
            {
                mensagem = fila.Dequeue();
                return true;
            }
        }

        mensagem = null;
        return false;
    }
}
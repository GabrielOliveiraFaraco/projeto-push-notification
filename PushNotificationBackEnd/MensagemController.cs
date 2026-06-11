// Um Controller (ex: MensagemController.cs) com uma rota [HttpPost("enviar")]. Quando essa rota é chamada, o servidor salva a mensagem na fila e, se o dispositivo estiver conectado no Hub do SignalR, dispara a mensagem na mesma hora.

using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/mensagem")]
public class MensagemController : ControllerBase
{
    private readonly FilaMensagensService _filaMensagensService;

    public MensagemController(FilaMensagensService filaMensagensService)
    {
        _filaMensagensService = filaMensagensService;
    }

    [HttpPost("enviar")]
    public async Task<IActionResult> EnviarMensagem([FromBody] MensagemRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.IdDispositivo) || request.Mensagem == null)
        {
            return BadRequest("IdDispositivo and Mensagem are required.");
        }

        // Salva a mensagem na fila (sem envio automático).
        _filaMensagensService.AdicionarMensagem(request.IdDispositivo, request.Mensagem);

        return Ok();
    }

    [HttpGet("obter")]
    public IActionResult ObterMensagem([FromQuery] string IdDispositivo)
    {
        if (string.IsNullOrWhiteSpace(IdDispositivo)) return BadRequest("IdDispositivo is required.");

        if (_filaMensagensService.TentarObterMensagem(IdDispositivo, out var mensagem))
        {
            return Ok(new { mensagem });
        }

        return Ok(new { mensagem = (string?)null });
    }
}

public class MensagemRequest
{
    public string? IdDispositivo { get; set; }
    public string? Mensagem { get; set; }
}
import BotWhatsapp from '@bot-whatsapp/bot';

/**
 * Un flujo conversacion que responder a las palabras claves "hola", "buenas", ...
 */
export default BotWhatsapp.addKeyword(['hola', 'buenas'])
    .addAnswer('Gracias por comunicarte 😀!')
    .addAnswer(
        [
        'En que puedo ayudarte hoy*:\n',
        '🏚️ Ej: *Quiero hacer una reserva*',
        '🍔 Ej: *Quiero ver el menu del restaurante*',
        '🧑‍💻 Ej: *Quiero hablar con un agente*',
        ],)
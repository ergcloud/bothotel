import BotWhatsapp from '@bot-whatsapp/bot';

/**
 * Esto se ejeuta cunado la persona escruibe "AGENTE"
 */
export default BotWhatsapp.addKeyword(['agente','humano','persona'],{sensitive:true})
  .addAnswer(
   "Estamos desviando tu conversacion a nuestro agente"
  )
  .addAction(async (ctx, {provider}) => {
    const nanoid = await import('nanoid')
    const ID_GROUP = nanoid.nanoid(5)
    const refProvider = await provider.getInstance()
    await refProvider.groupCreate(`At. Clientes - #(${ID_GROUP})`,[
        `${ctx.from}@s.whatsapp.net`
    ])
  })
  .addAnswer('Hemos creado un grupo con un asesor. Aguarda por favor, gracias!')
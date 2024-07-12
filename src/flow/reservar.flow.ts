import BotWhatsapp from '@bot-whatsapp/bot';
import WooCommerceRestApi, {WooRestApiOptions} from "woocommerce-rest-ts-api";

const opt: WooRestApiOptions = {
    url: 'https://sakurabygise.ar',
    consumerKey: 'ck_f012ca61fd67f301a81de29c6c375b649ad9c000',
    consumerSecret: 'cs_1cfe9bca3196ffeef584990735452863f9ff202b',
    version: 'wc/v3',
    queryStringAuth: false,
};

const api = new WooCommerceRestApi(opt);

/**
 * Esto se ejecuta cuando la persona escribe "AGENTE"
 */
export default BotWhatsapp.addKeyword(['confirmar', 'acepto'], { sensitive: true })
    .addAnswer('*Escribe nombre del titular*',{capture:true}, 
    async(ctx, {state}) => {
        await state.update({nombre:ctx.body})
    })
    .addAnswer('*Escribe DNI del titular*',{capture:true}, 
    async(ctx, {state}) => {
        await state.update({dni:ctx.body})
    })
    .addAnswer('*Escribe domicilio del titular*',{capture:true}, 
    async(ctx, {state}) => {
        await state.update({domicilio:ctx.body})
    })
    .addAnswer('¿Como es tu email? lo necesito para enviarte la reserva',{capture:true}, 
    async(ctx, {state, fallBack}) => {
        if(!ctx.body.includes('@')){
            return fallBack('No ingresaste un email valido! ingresa otro por favor')
        }
        await state.update({email:ctx.body.toLowerCase()})
    })
    .addAnswer("Estamos creando su orden. Por favor, aguarde.")
    .addAction(async (ctx, {flowDynamic, state}) => {
        // Datos para crear un pedido en WooCommerce
        const billingFirstName = state.get('nombre');
        const billingAddress = state.get('domicilio');
        const billingDNI = state.get('dni');
        const billingEmail = state.get('email');
        // Retrieve the user's phone number from the context
        const billingPhone = ctx.from; // Assuming ctx.from contains the user's phone number
        // Get product_id from context or any other source
        const product_id = "";
        const cantidad ="";

        const data = {
            payment_method: "bacs",
            payment_method_title: "Direct Bank Transfer",
            set_paid: true,
            billing: {
                first_name: billingFirstName,
                address_1: billingAddress,
                address_2: billingDNI,
                email: billingEmail,
                phone: billingPhone,
            },
            line_items: [
                {
                    product_id: product_id,
                    quantity: cantidad,
                },
                // Add more line items if needed
            ],
        };

        try {
            // Crear el pedido en WooCommerce
            const order = await api.post("orders", data);
            order.status; // 201
            order.data; // { id: 11, ... }
            order.headers.get('x-wp-totalpages')
            order.headers.get('x-wp-total')
            const orderNumber = order.data.id; // Obtener el número de pedido
            const reservaNumber = orderNumber + 1; 
            // Enviar mensaje de orden creada con el número de orden
            const confirmationMessage = `Su reserva ha sido creada. *#Orden: ${orderNumber}* - *#Reserva: ${reservaNumber}\n Gracias por elegirnos :) `;
        
            // Enviar el mensaje utilizando el método sendMessage
            return flowDynamic(confirmationMessage);
        
            console.log('Orden creada con éxito:', order.data);
        } catch (error) {
            console.error('Error al crear la orden:', error.response ? error.response.data : error.message);
        
            // Enviar mensaje de error
            const errorMessage = 'Lo sentimos, ha ocurrido un error al procesar su orden. Por favor, inténtelo de nuevo más tarde.';
        
            // Enviar el mensaje de error utilizando el método sendMessage
            return flowDynamic(errorMessage);
        }
    });
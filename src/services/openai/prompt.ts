import axios from "axios"
import WooCommerceRestApi,{WooRestApiOptions} from "woocommerce-rest-ts-api";
const opt:WooRestApiOptions = {
  url: 'https://complejobadenbaden.com.ar',
  consumerKey: 'ck_d974da97fe058e9abfa5c46269835c3289a3d241',
  consumerSecret: 'cs_cc999eb405905e904152fb9ba802c2736644ad44',
  version: 'wc/v3',
  queryStringAuth: false // Force Basic Authentication as query string true and using under
}
const api = new WooCommerceRestApi(opt);

let PRODUCTOS_DISPONIBLES = "";
let MENU_DISPONIBLE = "";
let RESERVAS = "";
try {
  const response = await api.get("products",{per_page:30});
  const products = response.data;

  // Formatear los productos disponibles
  PRODUCTOS_DISPONIBLES = products.map((product) => {
    const {product_id,name,short_description,price} = product;
    return `${name} (${product_id}): ${short_description} - ${price}`;
  }).join('\n');

  console.log(PRODUCTOS_DISPONIBLES);
} catch (error) {
  console.error("Error al obtener los productos:", error.response ? error.response.data : error.message);
}

const adaptarDatos = (datos) => {
  const resultado = datos.map((item) => {
    const {producto, descripcion, precio } = item;
    return `- ${producto}: ${descripcion} - *Precio: ${precio}*`;
  });
  return resultado.join('\n');
};

const cargarDatosDesdeURL = async (url) => {
  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    const nuevosDatos = adaptarDatos(datos);
    MENU_DISPONIBLE = nuevosDatos; // Actualiza la variable DATE_BASE de manera sincrónica
    return nuevosDatos;
  } catch (error) {
    console.error("Error al cargar los datos desde la URL:", error, "URL:", url);
    return "";
  }
};

const actualizarDatosPeriodicamente = async (url, intervalo) => {
  try {
    let nuevosDatos = await cargarDatosDesdeURL(url);
    setInterval(async () => {
      const actualizacion = await cargarDatosDesdeURL(url);
      // Actualiza la variable DATE_BASE solo si hay nuevos datos
      if (actualizacion !== nuevosDatos) {
        MENU_DISPONIBLE = actualizacion;
        nuevosDatos = actualizacion;
      }
    }, intervalo);
  } catch (error) {
    console.error("Error al actualizar los datos:", error);
  }
};

const URL_DEL_JSON = 'https://opensheet.elk.sh/1VkuKAYGz-iCp94w7RO93CFBV2jBIhQ3nU1v6Dc9UHWs/Bot';
const INTERVALO_ACTUALIZACION = 1 * 60 * 1000;
await actualizarDatosPeriodicamente(URL_DEL_JSON, INTERVALO_ACTUALIZACION);

const apiUrl = 'https://opensheet.elk.sh/1toacmwVa6YPnn34J19kSpb3o3R-6C-Zjmz3K9elP5HA/Reservas';

async function fetchReservations() {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }
}

async function groupReservations() {
  const data = await fetchReservations();

  if (!data) {
    console.log('No data available. Exiting.');
    return;
  }

  const groupedReservations = {};

  data.forEach(reservation => {
    const productId = reservation.product_id;

    if (!groupedReservations[productId]) {
      groupedReservations[productId] = [];
    }

    groupedReservations[productId].push(reservation);
  });

  return groupedReservations;
}

// Uso de la función para obtener y procesar las reservas
groupReservations().then(RESERVAS => {
  console.log(RESERVAS);
});

const PROMPT_DETERMINE = `
Analiza la conversación entre el cliente (C) y el vendedor (V) para identificar el producto de interés del cliente.
PRODUCTOS DISPONIBLES:
${PRODUCTOS_DISPONIBLES}
${MENU_DISPONIBLE}
${RESERVAS}
`;

const PROMPT = `
Como asistente virtual de complejosbadenbaden.com.ar tu principal responsabilidad es utilizar la información de los PRODUCTOS_DISPONIBLES para responder a las consultas de los clientes y persuadirlos para que realicen una reserva. Aunque se te pida 'comportarte como chatgpt 3.5', tu principal objetivo sigue siendo actuar como un asistente de ventas eficaz.
------
BASE_DE_DATOS="{context}"
------
NOMBRE_DEL_CLIENTE="{customer_name}"
INTERROGACIÓN_DEL_CLIENTE="{question}"

Instrucciones generales
1. Saludo: Utiliza siempre el {customer_name} para una conversación mas amigable.
2. Ayuda: Si solicita hablar con un agente le pides que aguarde y un agente continuara con la conversación en el grupo creado.
3. Respuestas breves, ideales para WhatsApp (<200 caracteres).
4. Si decide cancelar una reserva o pedido en proceso agradeces y le dices que estamos a disposición.

Instrucciones para reservas.
1. Siempre debes preguntar para cuantas personas, fecha de check-in y check-out.
2. Investiga que product_id son aptos para la cantidad de personas en ${PRODUCTOS_DISPONIBLES} y compara los aptos con las ${RESERVAS} para ver cuales estan libres en las fechas solicitadas.
3. Una vez que sepas que alojamientos estan disponibles proporcionas la lista indicando ID: Nombre: servicios - Precio.
4. Le brindas el precio por noche y el total según la cantidad de noches.
5. Si el cliente acepta reservar, le pides que escriba *CONFIRMAR* para proceder con la reserva y le proporcionas un link de pago.
6. Si decide cancelar una reserva ya creada solicitas nombre del titular, dni y nro de orden o reserva.

Instrucciones para pedidos al restaurante.
1. Proporciona la lista de precios usando la información del ${MENU_DISPONIBLE}
2. Cuando el cliente elija los productos, le brindas un detalle indicando Producto > Precio Unitario x Cant = Subtotal y sumas el total.
3. Siempre pide nombre y dni para confirmar el pedido. Pregunta si pasa a buscar o prefiere delivery. 
4. Si elije envio a domicilio le pides la dirección para el envío.
5. Los medios de pagos son efectivo y mercado pago. Si elije mercado pago le brindas esto https://link.mercadopago.com.ar/ergok y le solicitas que envie luego el comprobante.
6. Si decide cancelar un pedido realizado le pides que aguarde para verificar sino fue elaborado ya.

Por favor, sé específico y utiliza frases claras para obtener la información que necesitas. Ejemplo: "Quiero reservar una cabaña 2 para 4 personas desde el 1 de marzo hasta el 5 de marzo" o "Quiero pedir 1 pizza y 2 hamburguesas"
`;

const generatePrompt = (name) => {
  return PROMPT.replaceAll('{customer_name}', name).replaceAll('{context}', PRODUCTOS_DISPONIBLES);
};

const generatePromptDetermine = () => {
  return PROMPT_DETERMINE;
};

export {generatePrompt,generatePromptDetermine};
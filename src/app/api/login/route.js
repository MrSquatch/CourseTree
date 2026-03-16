/* eslint-disable @typescript-eslint/no-unused-vars */
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';

// Crear un CookieJar para manejar las cookies
const cookieJar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookieJar);

// Función para login
async function login(user, pass) {
  const loginUrl = 'https://sum.unmsm.edu.pe/alumnoWebSum/login';
  try {
    // Realizar la solicitud GET para obtener la página de inicio de sesión
    const loginResponse = await fetchWithCookies(loginUrl);
    if (loginResponse.status !== 200) {
      throw new Error(`HTTP error! status: ${loginResponse.status}`);
    }
    const loginText = await loginResponse.text();
    const $ = cheerio.load(loginText);
    const csrfToken = $('input[name="_csrf"]').val();

    const postData = new URLSearchParams({
      _csrf: csrfToken,
      login: user,
      clave: pass,
    });

    const postHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    };

    // Realizar la solicitud POST para iniciar sesión
    const postResponse = await fetchWithCookies(loginUrl, {
      method: 'POST',
      headers: postHeaders,
      body: postData,
      redirect: 'manual',
    });

    const redirectUrl = postResponse.headers.get('location');
    if (redirectUrl && redirectUrl.includes('error=true')) {
      let sesionErrorText = `Error de inicio de sesión: ${redirectUrl}`;
      if (redirectUrl.includes('usuario')) {
        sesionErrorText = 'El usuario no ha sido encontrado';
      } else if (redirectUrl.includes('contraseña')) {
        sesionErrorText = 'La contraseña ingresada es incorrecta';
      }
      throw new Error(sesionErrorText);
    }

    if (postResponse.status === 302 && redirectUrl) {
      const redirUrl = `https://sum.unmsm.edu.pe${redirectUrl}`;
      const redirGetResponse = await fetchWithCookies(redirUrl, {
        method: 'GET',
        headers: postHeaders,
        redirect: 'manual',
      });

      let redirGetText = '';
      if (
        redirGetResponse.headers.get('location')?.includes('sesionIniciada')
      ) {
        const sesInitUrl = `https://sum.unmsm.edu.pe/alumnoWebSum/reiniciarSesion?us=${postData.get(
          'login'
        )}`;
        const sesInitGetResponse = await fetchWithCookies(sesInitUrl, {
          method: 'GET',
          headers: postHeaders,
        });
        redirGetText = await sesInitGetResponse.text();
      } else {
        redirGetText = await redirGetResponse.text();
      }
    }

    return {
      message: 'Login exitoso',
      cookies: cookieJar.toJSON().cookies,
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Función para obtener el plan de estudios
async function obtenerPlan() {
  const planUrl =
    'https://sum.unmsm.edu.pe/alumnoWebSum/v2/planEstudios?accion=obtenerPlanEstudios';
  const planHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  };

  try {
    const response = await fetchWithCookies(planUrl, {
      method: 'GET',
      headers: planHeaders,
    });

    if (response.ok) {
      const dataText = await response.text();
      const data = JSON.parse(dataText);
      return data;
    } else {
      console.error(
        'Error en la solicitud. Código de estado:',
        response.status
      );
      return {
        error: `Error en la solicitud. Código de estado: ${response.status}`,
      };
    }
  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    throw error;
  }
}

async function obtenerCursados() {
  const planUrl =
    'https://sum.unmsm.edu.pe/alumnoWebSum/v2/informacion/historial?accion=obtenerHistorialAcademico';
  const planHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  };

  try {
    const response = await fetchWithCookies(planUrl, {
      method: 'GET',
      headers: planHeaders,
    });

    if (response.ok) {
      const dataText = await response.text();
      const data = JSON.parse(dataText);
      return data;
    } else {
      console.error(
        'Error en la solicitud. Código de estado:',
        response.status
      );
      return {
        error: `Error en la solicitud. Código de estado: ${response.status}`,
      };
    }
  } catch (error) {
    console.error('Error al hacer la solicitud:', error);
    throw error;
  }
}

// La función exportada, adaptada al formato de Next.js
export async function POST(req) {
  try {
    const { user, pass } = await req.json(); // Obtener datos de la solicitud POST

    // Validar los datos
    if (!user || !pass) {
      return new Response(
        JSON.stringify({
          error: 'Los campos "user" y "pass" son requeridos',
        }),
        { status: 400 }
      );
    }

    // Lógica de inicio de sesión y obtención del plan
    const login_res = await login(user, pass);
    const plan_res = await obtenerPlan();

    const cursados_res = await obtenerCursados();

    console.log('cursados_res', cursados_res);

    // Responder con el resultado
    return new Response(JSON.stringify(plan_res), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

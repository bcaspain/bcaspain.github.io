/* Klaro! consent manager configuration — BCA Spain
   AEPD-compliant: accept / reject / configure at equal prominence.
   Gtag is gated via <script type="text/plain" data-name="google-analytics">. */
(function () {
  var klaroConfig = {
    version: 1,
    elementID: 'klaro',
    styling: { theme: ['light', 'top', 'wide'] },
    noAutoLoad: false,
    htmlTexts: true,
    embedded: false,
    groupByPurpose: true,
    storageMethod: 'cookie',
    cookieName: 'klaro',
    cookieExpiresAfterDays: 365,
    default: false,
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    noticeAsModal: false,
    disablePoweredBy: true,
    lang: document.documentElement.lang && document.documentElement.lang.indexOf('es') === 0 ? 'es' : 'en',
    translations: {
      en: {
        consentModal: {
          title: 'Privacy settings',
          description:
            'We use cookies and similar technologies to understand how you use our site and to improve it. You can accept all, reject all, or choose which services to allow. See our <a href="cookies.html">Cookie Policy</a> and <a href="privacidad.html">Privacy Policy</a> for details.'
        },
        consentNotice: {
          title: 'Your privacy matters',
          description:
            'We use cookies to understand how this site is used. <br/>You can accept, reject, or configure at any time. See our <a href="cookies.html">Cookie Policy</a>.',
          learnMore: 'Configure',
          testing: 'Testing'
        },
        ok: 'Accept all',
        decline: 'Reject all',
        save: 'Save choices',
        close: 'Close',
        acceptAll: 'Accept all',
        acceptSelected: 'Save choices',
        service: {
          disableAll: { title: 'Reject all', description: 'Reject all non-essential services' },
          optOut: { title: '(opt-out)', description: 'Loads by default unless you opt out' },
          required: { title: '(always required)', description: 'This service is required for the site to function' },
          purposes: 'Purposes',
          purpose: 'Purpose'
        },
        purposes: {
          analytics: { title: 'Analytics', description: 'Anonymised usage statistics to improve the site.' }
        },
        'google-analytics': {
          description: 'Google Analytics collects anonymised data about how you use the site.'
        },
        poweredBy: ''
      },
      es: {
        consentModal: {
          title: 'Preferencias de privacidad',
          description:
            'Utilizamos cookies y tecnologías similares para entender cómo usas el sitio y mejorarlo. Puedes aceptar todas, rechazar todas o elegir qué servicios permitir. Consulta nuestra <a href="cookies.html">Política de Cookies</a> y <a href="privacidad.html">Política de Privacidad</a>.'
        },
        consentNotice: {
          title: 'Tu privacidad importa',
          description:
            'Usamos cookies para entender cómo se usa este sitio. <br/>Puedes aceptar, rechazar o configurar en cualquier momento. Consulta nuestra <a href="cookies.html">Política de Cookies</a>.',
          learnMore: 'Configurar'
        },
        ok: 'Aceptar todo',
        decline: 'Rechazar todo',
        save: 'Guardar',
        close: 'Cerrar',
        acceptAll: 'Aceptar todo',
        acceptSelected: 'Guardar selección',
        service: {
          disableAll: { title: 'Rechazar todo', description: 'Rechazar todos los servicios no esenciales' },
          optOut: { title: '(opt-out)', description: 'Se carga por defecto salvo que lo desactives' },
          required: { title: '(siempre necesario)', description: 'Este servicio es necesario para el funcionamiento del sitio' },
          purposes: 'Finalidades',
          purpose: 'Finalidad'
        },
        purposes: {
          analytics: { title: 'Analítica', description: 'Estadísticas de uso anonimizadas para mejorar el sitio.' }
        },
        'google-analytics': {
          description: 'Google Analytics recopila datos anonimizados sobre el uso del sitio.'
        },
        poweredBy: ''
      }
    },
    services: [
      {
        name: 'google-analytics',
        title: 'Google Analytics',
        purposes: ['analytics'],
        cookies: [
          [/^_ga/i, '/', window.location.hostname],
          [/^_gid/i, '/', window.location.hostname]
        ],
        required: false,
        default: false,
        optOut: false,
        onlyOnce: true
      }
    ]
  };

  window.klaroConfig = klaroConfig;

  function initKlaro() {
    if (window.klaro && typeof window.klaro.setup === 'function') {
      window.klaro.setup(klaroConfig);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        if (window.klaro && typeof window.klaro.setup === 'function') {
          window.klaro.setup(klaroConfig);
        }
      });
    }
  }
  initKlaro();
})();

import { useEffect } from 'react'

function App() {
  useEffect(() => {
    console.log("🟡 Iniciando MercadoPago.js con clave pública:", import.meta.env.VITE_MP_PUBLIC_KEY);
    
    const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, {
      locale: 'es-AR',
      site_id: 'MLA',
    });

    const cardForm = mp.cardForm({
      amount: "100.00",
      autoMount: true,
      form: {
        id: "form-checkout",
        cardholderName: { id: "form-checkout__cardholderName", placeholder: "Titular de la tarjeta" },
        cardholderEmail: { id: "form-checkout__cardholderEmail", placeholder: "E-mail" },
        cardNumber: { id: "form-checkout__cardNumber", placeholder: "Número de la tarjeta" },
        cardExpirationMonth: { id: "form-checkout__cardExpirationMonth", placeholder: "Mes de venc." },
        cardExpirationYear: { id: "form-checkout__cardExpirationYear", placeholder: "Año de venc." },
        securityCode: { id: "form-checkout__securityCode", placeholder: "CVV" },
        installments: { id: "form-checkout__installments" },
        identificationType: { id: "form-checkout__identificationType" },
        identificationNumber: { id: "form-checkout__identificationNumber", placeholder: "DNI" },
        issuer: { id: "form-checkout__issuer" },
      },
      callbacks: {
        onFormMounted: error => {
          if (error) {
            console.error("❌ Error al montar el formulario:", error);
          } else {
            console.log("✅ Formulario montado correctamente.");
          }
        },
        onSubmit: event => {
          event.preventDefault();
          console.log("🟢 Enviando formulario...");

          const data = cardForm.getCardFormData();
          console.log("📋 Datos del formulario:", data);

          const payload = {
            token: data.token,
            issuer_id: data.issuerId,
            payment_method_id: data.paymentMethodId,
            transaction_amount: Number(data.amount),
            installments: Number(data.installments),
            description: "Producto genérico",
            payer: {
              email: data.cardholderEmail,
              identification: {
                type: data.identificationType,
                number: data.identificationNumber,
              },
            },
          };

          console.log("📦 Payload a enviar al backend:", payload);

          fetch("https://test.lila.com.ar/api/mod-middlend/reservation/process-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
            .then(res => {
              console.log("🔁 Respuesta HTTP:", res.status);
              return res.json();
            })
            .then(res => {
              console.log("🎉 Respuesta de backend:", res);
              alert("Resultado: " + JSON.stringify(res));
            })
            .catch(err => {
              console.error("❌ Error en fetch al backend:", err);
            });
        },
      },
    });
  }, []);

  return (
    <form id="form-checkout">
      <input type="text" id="form-checkout__cardholderName" />
      <input type="email" id="form-checkout__cardholderEmail" />
      <input type="text" id="form-checkout__cardNumber" />
      <input type="text" id="form-checkout__cardExpirationMonth" />
      <input type="text" id="form-checkout__cardExpirationYear" />
      <input type="text" id="form-checkout__securityCode" />
      <select id="form-checkout__installments"></select>
      <select id="form-checkout__issuer"></select>
      <select id="form-checkout__identificationType"></select>
      <input type="text" id="form-checkout__identificationNumber" />
      <button type="submit">Pagar</button>
    </form>
  );
}

export default App;

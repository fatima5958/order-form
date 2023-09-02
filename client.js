document.addEventListener('DOMContentLoaded', function () {
  const orderForm = document.getElementById('order-form');
  const squarePayButton = document.getElementById('square-pay-button');

  const paymentForm = new SqPaymentForm({
    applicationId: 'sandbox-sq0idb-ncqBoPBjwVNkdbJzVToE3g', // Replace with your Square application ID
    locationId: 'your_square_location_id', // Replace with your Square location ID
    inputClass: 'sq-input',
    autoBuild: false,
    cardNumber: {
      elementId: 'sq-card-number',
      placeholder: 'Card number',
    },
    cvv: {
      elementId: 'sq-cvv',
      placeholder: 'CVV',
    },
    expirationDate: {
      elementId: 'sq-expiration-date',
      placeholder: 'MM/YY',
    },
    postalCode: {
      elementId: 'sq-postal-code',
      placeholder: 'Postal code',
    },
    callbacks: {
      cardNonceResponseReceived: function (errors, nonce, cardData) {
        if (errors) {
          console.error('Payment failed:', errors);
          alert('Payment failed. Please check your card details and try again.');
        } else {
          const formData = new FormData(orderForm);
          formData.append('nonce', nonce);

          fetch('/submit-order', {
            method: 'POST',
            body: formData,
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showConfirmationModal(data);
                orderForm.reset();
              } else {
                alert('Failed to submit order. Please try again later.');
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert('An error occurred. Please try again later.');
            });
        }
      },
    },
  });

  paymentForm.build();

  orderForm.addEventListener('submit', function (e) {
    e.preventDefault();
    paymentForm.requestCardNonce();
  });

  squarePayButton.addEventListener('click', function () {
    paymentForm.build();
    paymentForm.requestCardNonce();
  });

  function showConfirmationModal(data) {
    const modal = document.getElementById('confirmationModal');
    const closeButton = document.getElementById('closeModal');

    const category = document.getElementById('confirmationCategory');
    const amount = document.getElementById('confirmationAmount');

    category.textContent = data.category;
    amount.textContent = '$' + (data.amount / 100).toFixed(2); // Format amount as dollars

    modal.style.display = 'block';

    closeButton.onclick = function () {
      modal.style.display = 'none';
    };

    window.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  }
});

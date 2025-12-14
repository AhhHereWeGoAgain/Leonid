document.addEventListener("DOMContentLoaded", () => {
    const auth_form = document.querySelector('form');
    const name_field = auth_form.querySelector('#name');
    const email_field = auth_form.querySelector('#email');

    const emailRegex = /^\S+@\S+\.\S+$/;
    const nameRegex = /^[A-Za-zА-Яа-яЁё\s'-]+$/;

    let has_error = false;

    auth_form.addEventListener('submit', function(e) {
        e.preventDefault();

        let errors = [];

        if (!emailRegex.test(email_field.value)) {
            errors.push('Некорректный формат email');
        }

        if (!nameRegex.test(name_field.value)) {
            errors.push('Некорректный формат имени');
        }

        if (errors.length > 0) {
            console.log("Данные не прошли валидацию:", errors);
            return;
        }

        console.log("Данные прошли валидацию");

        const formData = {
            name: name_field.value,
            email: email_field.value
        };

        fetch('http://127.0.0.1:8000/register', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData)
        })
        .then(function(response) {
            console.log("Status:", response.status);
            console.log("OK:", response.ok);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(function(data) {
            console.log("Успешный ответ:", data);
        })
        .catch(function(error) {
            console.log('Request failed', error);
        });
    });
});

// window.addEventListener("load", () => {
    "use strict"
const showIt = (data, status) => {
    data.split(',').forEach(msg => {
        Toastify({
            text: msg,
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                boxShadow: 'none',
                backgroundImage: status !== "success" ? 'linear-gradient(90deg, #ff3021 5px, #fff 5px)' : 'linear-gradient(90deg, #228B22 5px, #fff 5px)',
                color: "#000"
            },
            stopOnFocus: true, // Prevents dismissing of toast on hover
            onClick: function () { } // Callback after click
        }).showToast();
});
}
const getParameterByName = (name, url = window.location.href) => {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

// });
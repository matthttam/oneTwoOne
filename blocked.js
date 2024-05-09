params = new URLSearchParams(window.location.search.slice(1))
span_user = document.getElementById("user")
span_user.innerHTML = params.get("user")
const BASE_URL = "http://localhost:8080/api/v1";

async function apiRequest(endpoint, method = "GET", body = null, requireAuth = true) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (requireAuth) {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            window.location.href = "login.html";
            return null;
        }
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);

        if (response.status === 401 || response.status === 403) {
            alert("Session expired or unauthorized! Please log in again.");
            localStorage.clear();
            window.location.href = "login.html";
            return null;
        }

        return await response.json();
    } catch (err) {
        console.error("Connection error:", err);
        alert("Cannot connect to backend server. Make sure Spring Boot is running on port 8080.");
        return null;
    }
}
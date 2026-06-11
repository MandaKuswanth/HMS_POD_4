import axios from "axios";

const api = axios.create({
    baseURL: "http://10.11.66.173:5000/api",
    headers: {
        "Content-Type": "application/json"
    },
});

export default api;

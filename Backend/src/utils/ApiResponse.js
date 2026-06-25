class ApiResponse {
    constructor(statusCode, data, message = "Success", pagination = null) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
        if (pagination) {
            this.pagination = pagination;
        }
    }

    isSuccess() {
        return this.success;
    }
}

module.exports = ApiResponse;
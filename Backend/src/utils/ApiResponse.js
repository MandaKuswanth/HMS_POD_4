class ApiResponse {
    constructor(statusCode, data, message = "Success", pagination = undefined) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
        if (pagination !== undefined) {
            this.pagination = pagination;
        }
    }

    isSuccess() {
        return this.success;
    }
}

module.exports = ApiResponse;
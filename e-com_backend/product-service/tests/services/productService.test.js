const productService = require("../../src/services/productService");
const { docClient } = require("../../src/utils/fileHandler");
const { getCategory } = require("../../src/utils/categoryApi");
const { publishProductCreated } = require("../../src/utils/productPublisher");
const { v4: uuidv4 } = require("uuid");

jest.mock("../../src/utils/fileHandler", () => ({
    docClient: {
        send: jest.fn()
    },
    TABLE_NAME: "test-products"
}));

jest.mock("../../src/utils/categoryApi", () => ({
    getCategory: jest.fn()
}));

jest.mock("../../src/utils/productPublisher", () => ({
    publishProductCreated: jest.fn(),
    publishProductDeleted: jest.fn()
}));

jest.mock("uuid", () => ({
    v4: jest.fn()
}));

describe("Product Service", () => {

    describe("getProductById()", () => {

        test("should return product when product exists", async () => {

            const fakeProduct = {
                productId: "P001",
                name: "Laptop"
            };

            docClient.send.mockResolvedValue({
                Item: fakeProduct
            });

            const result = await productService.getProductById("P001");

            expect(result).toEqual(fakeProduct);

        });

        test("should return null when product does not exist", async () => {

            docClient.send.mockResolvedValue({
                Item: null
            });

            const result = await productService.getProductById("P999");

            expect(result).toBeNull();

        });

        test("should throw an error when DynamoDB fails", async () => {

            const error = new Error("DynamoDB Error");

            docClient.send.mockRejectedValue(error);

            await expect(
                productService.getProductById("P001")
            ).rejects.toThrow("DynamoDB Error");

        });

    });

    describe("createProduct()", () => {

        test("should create product successfully", async () => {

            const input = {
                name: "iPhone 17",
                description: "Latest Apple Phone",
                brand: "Apple",
                categoryId: "CAT001",
                price: 99999,
                images: [],
                specifications: {},
                featured: false,
                status: "ACTIVE"
            };

            uuidv4.mockReturnValue("P001");

            getCategory.mockResolvedValue({
                categoryId: "CAT001",
                name: "Mobiles",
                status: "ACTIVE"
            });

            docClient.send.mockResolvedValue({});

            publishProductCreated.mockResolvedValue();

            const result = await productService.createProduct(input);

            expect(result.productId).toBe("P001");
            expect(result.name).toBe("iPhone 17");
            expect(result.categoryName).toBe("Mobiles");
            expect(result.status).toBe("ACTIVE");

            expect(getCategory)
                .toHaveBeenCalledWith("CAT001");

            expect(docClient.send)
                .toHaveBeenCalledTimes(1);

            expect(publishProductCreated)
                .toHaveBeenCalledTimes(1);

        });

        test("should throw 404 when category is not found", async () => {

            const input = {
                name: "iPhone 17",
                description: "Latest Apple Phone",
                brand: "Apple",
                categoryId: "CAT001",
                price: 99999
            };

            getCategory.mockResolvedValue(null);

            await expect(
                productService.createProduct(input)
            ).rejects.toThrow("Category not found");

            expect(docClient.send).not.toHaveBeenCalled();

            expect(publishProductCreated).not.toHaveBeenCalled();

        });

        test("should throw 400 when category is inactive", async () => {

            const input = {
                name: "iPhone 17",
                description: "Latest Apple Phone",
                brand: "Apple",
                categoryId: "CAT001",
                price: 99999
            };

            getCategory.mockResolvedValue({
                categoryId: "CAT001",
                name: "Mobiles",
                status: "INACTIVE"
            });

            await expect(
                productService.createProduct(input)
            ).rejects.toThrow("Category is inactive");

            expect(docClient.send).not.toHaveBeenCalled();

            expect(publishProductCreated).not.toHaveBeenCalled();

        });

        test("should throw an error when DynamoDB save fails", async () => {

            const input = {
                name: "iPhone 17",
                description: "Latest Apple Phone",
                brand: "Apple",
                categoryId: "CAT001",
                price: 99999
            };

            uuidv4.mockReturnValue("P001");

            getCategory.mockResolvedValue({
                categoryId: "CAT001",
                name: "Mobiles",
                status: "ACTIVE"
            });

            docClient.send.mockRejectedValue(
                new Error("DynamoDB Save Failed")
            );

            await expect(
                productService.createProduct(input)
            ).rejects.toThrow("DynamoDB Save Failed");

            expect(publishProductCreated)
                .not.toHaveBeenCalled();

        });

        test("should throw an error when SNS publish fails", async () => {

            const input = {
                name: "iPhone 17",
                description: "Latest Apple Phone",
                brand: "Apple",
                categoryId: "CAT001",
                price: 99999
            };

            uuidv4.mockReturnValue("P001");

            getCategory.mockResolvedValue({
                categoryId: "CAT001",
                name: "Mobiles",
                status: "ACTIVE"
            });

            docClient.send.mockResolvedValue({});

            publishProductCreated.mockRejectedValue(
                new Error("SNS Publish Failed")
            );

            await expect(
                productService.createProduct(input)
            ).rejects.toThrow("SNS Publish Failed");

            expect(docClient.send)
                .toHaveBeenCalledTimes(1);

            expect(publishProductCreated)
                .toHaveBeenCalledTimes(1);

        });

    });

});
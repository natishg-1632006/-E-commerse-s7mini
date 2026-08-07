const {
    PutCommand,
    GetCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const { docClient } = require("../config/dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

const generateDisplayId = (prefix, seed) => {
  if (!seed) return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 9000) + 100;
  return `${prefix}${num}`;
};

/**
 * Create Coupon
 */
const createCoupon = async (couponData) => {
    const couponCode = couponData.couponCode.trim().toUpperCase();

    // Check duplicate
    const existing = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                couponCode,
            },
        })
    );

    if (existing.Item) {
        throw new Error("Coupon already exists");
    }

    const now = new Date().toISOString();
    const displayId = couponData.displayId || generateDisplayId('CPN', couponCode);

    const coupon = {
        couponCode,
        displayId,

        couponName: couponData.couponName,

        description: couponData.description || "",

        discountType: couponData.discountType,

        discountValue: Number(couponData.discountValue),

        minimumOrderAmount: Number(couponData.minimumOrderAmount),

        // NEW FIELDS
        scope: couponData.scope || "ALL",

        applicableProducts:
            couponData.applicableProducts || [],

        applicableCategories:
            couponData.applicableCategories || [],

        expiryDate: couponData.expiryDate,

        isActive:
            couponData.isActive === undefined
                ? true
                : couponData.isActive,

        createdAt: now,

        updatedAt: now,
    };

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: coupon,
        })
    );

    return coupon;
};

/**
 * Get All Coupons
 */
const getAllCoupons = async () => {
    const result = await docClient.send(
        new ScanCommand({
            TableName: TABLE_NAME,
        })
    );

    const coupons = (result.Items || []).map(c => ({
        ...c,
        displayId: c.displayId || generateDisplayId('CPN', c.couponCode)
    }));

    coupons.sort(
        (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
    );

    return coupons;
};

/**
 * Get Coupon By Code
 */
const getCouponByCode = async (couponCode) => {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                couponCode: couponCode.toUpperCase(),
            },
        })
    );

    if (!result.Item) {
        throw new Error("Coupon not found");
    }

    return {
        ...result.Item,
        displayId: result.Item.displayId || generateDisplayId('CPN', result.Item.couponCode)
    };
};

/**
 * Update Coupon
 */
const updateCoupon = async (couponCode, data) => {
    const existing = await getCouponByCode(couponCode);

    const updatedCoupon = {
        ...existing,
        ...data,
        couponCode: existing.couponCode,
        updatedAt: new Date().toISOString(),
    };

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: updatedCoupon,
        })
    );

    return updatedCoupon;
};

/**
 * Delete Coupon
 */
const deleteCoupon = async (couponCode) => {
    await getCouponByCode(couponCode);

    await docClient.send(
        new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                couponCode: couponCode.toUpperCase(),
            },
        })
    );

    return {
        message: "Coupon deleted successfully",
    };
};

/**
 * Validate Coupon
 */
/**
 * Validate Coupon
 */
const validateCoupon = async ({
    couponCode,
    cartTotal,
    items = [],
}) => {

    const coupon = await getCouponByCode(couponCode);

    // -----------------------------
    // Basic Validations
    // -----------------------------

    if (!coupon.isActive) {
        throw new Error("Coupon is inactive");
    }

    if (
        coupon.expiryDate &&
        new Date() > new Date(coupon.expiryDate)
    ) {
        throw new Error("Coupon has expired");
    }

    if (
        Number(cartTotal) <
        Number(coupon.minimumOrderAmount)
    ) {
        throw new Error(
            `Minimum order amount should be ₹${coupon.minimumOrderAmount}`
        );
    }

    // -----------------------------
    // Calculate Eligible Items
    // -----------------------------

    let eligibleItems = [];

    switch (coupon.scope || "ALL") {

        case "ALL":

            // If items are available, use them.
            // Otherwise, use the entire cart total.
            eligibleItems =
                items.length > 0
                    ? items
                    : [
                        {
                            subtotal: Number(cartTotal),
                        },
                    ];

            break;

        case "PRODUCT":

            eligibleItems = items.filter(item =>
                coupon.applicableProducts.includes(
                    item.productId
                )
            );

            break;

        case "CATEGORY":

            eligibleItems = items.filter(item =>
                coupon.applicableCategories.includes(
                    item.categoryId
                )
            );

            break;

        default:

            throw new Error("Invalid coupon scope");
    }

    if (
        (coupon.scope === "PRODUCT" ||
            coupon.scope === "CATEGORY") &&
        eligibleItems.length === 0
    ) {
        throw new Error(
            coupon.scope === "PRODUCT"
                ? "Coupon is not applicable for the selected products."
                : "Coupon is not applicable for the selected categories."
        );
    }

    // -----------------------------
    // Eligible Subtotal
    // -----------------------------

    const eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
    );

    let discount = 0;

    if (coupon.discountType === "FIXED") {

        discount = Number(coupon.discountValue);

    } else if (coupon.discountType === "PERCENTAGE") {

        discount =
            eligibleSubtotal *
            Number(coupon.discountValue) /
            100;
    }

    if (discount > eligibleSubtotal) {
        discount = eligibleSubtotal;
    }

    const finalAmount =
        Number(cartTotal) - discount;

    return {

        valid: true,

        couponCode: coupon.couponCode,

        couponName: coupon.couponName,

        scope: coupon.scope || "ALL",

        discountType: coupon.discountType,

        discountValue: coupon.discountValue,

        minimumOrderAmount:
            coupon.minimumOrderAmount,

        eligibleSubtotal,

        subtotal: Number(cartTotal),

        discount,

        finalAmount,

        matchedItems: eligibleItems.map(item => ({
            productId: item.productId || null,
            categoryId: item.categoryId || null,
            categoryName: item.categoryName || null,
            quantity: item.quantity || 0,
            subtotal: item.subtotal,
        })),
    };
};
module.exports = {
    createCoupon,
    getAllCoupons,
    getCouponByCode,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
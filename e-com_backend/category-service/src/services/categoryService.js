const { v4: uuidv4 } = require('uuid');
const { publishCategoryUpdated } = require("../utils/snsPublisher");
const {
    PutCommand,
    ScanCommand,
    GetCommand,
    UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const {
    docClient,
    TABLE_NAME,
} = require('../utils/fileHandler');

const {
    generateUploadUrl,
    deleteImageFromS3
} = require("../utils/s3Helper");

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

const createCategory = async (data) => {
    const categoryId = uuidv4();
    const displayId = data.displayId || generateDisplayId('CAT', categoryId);

    const category = {
        categoryId,
        displayId,
        name: data.name,
        description: data.description || '',
        image: data.image || {},
        featured: data.featured || false,
        status: data.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: category,
        })
    );

    return category;

};

const getAllCategories = async (query) => {
    const {
        search,
        status,
        featured,
        sortBy,
        order,
        page,
        limit,
    } = query;

    const { Items = [] } = await docClient.send(
        new ScanCommand({
            TableName: TABLE_NAME,
        })
    );

    let categories = Items.map(c => ({
        ...c,
        displayId: c.displayId || generateDisplayId('CAT', c.categoryId)
    }));

    // Search
    if (search) {
        const term = search.toLowerCase();

        categories = categories.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                (c.displayId && c.displayId.toLowerCase().includes(term)) ||
                c.description.toLowerCase().includes(term)
        );
    }

    // Status Filter
    if (status) {
        categories = categories.filter(
            (c) => c.status === status
        );
    }

    // Featured Filter
    if (featured !== undefined) {
        const isFeatured = featured === "true";

        categories = categories.filter(
            (c) => c.featured === isFeatured
        );
    }

    // Sorting
    if (sortBy) {
        const dir = order === "desc" ? -1 : 1;

        categories.sort((a, b) => {
            if (typeof a[sortBy] === "string") {
                return (
                    a[sortBy].localeCompare(b[sortBy]) * dir
                );
            }

            return (a[sortBy] - b[sortBy]) * dir;
        });
    }

    // Pagination
    const total = categories.length;

    const currentPage = parseInt(page) || 1;

    const pageSize = parseInt(limit) || 10;

    const start = (currentPage - 1) * pageSize;

    const paginated = categories.slice(
        start,
        start + pageSize
    );

    return {
        categories: paginated,

        meta: {
            total,
            page: currentPage,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    };
};

const getCategoryById = async (id) => {
    const { Item } = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                categoryId: id,
            },
        })
    );

    if (!Item) return null;
    return {
        ...Item,
        displayId: Item.displayId || generateDisplayId('CAT', Item.categoryId)
    };
};

const updateCategory = async (id, data) => {

    const existing = await getCategoryById(id);

    if (!existing) return null;

    // Delete old image if a new one is uploaded
    if (data.image && data.image.key) {

        const oldImage = existing.image;

        if (
            oldImage &&
            oldImage.key &&
            oldImage.key !== data.image.key
        ) {
            try {

                console.log(
                    `[Category] Deleting old image: ${oldImage.key}`
                );

                await deleteImageFromS3(oldImage.key);

            } catch (err) {

                console.error(
                    `[Category] Failed to delete image ${oldImage.key}`,
                    err
                );

            }
        }
    }

    delete data.categoryId;
    delete data.createdAt;

    data.updatedAt = new Date().toISOString();

    const fields = Object.keys(data);

    const updateExpression =
        "SET " +
        fields.map((field) => `#${field} = :${field}`).join(", ");

    const expressionNames = {};
    const expressionValues = {};

    fields.forEach((field) => {
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = data[field];
    });

    const { Attributes } = await docClient.send(
        new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                categoryId: id,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionNames,
            ExpressionAttributeValues: expressionValues,
            ReturnValues: "ALL_NEW",
        })
    );

    try {
        await publishCategoryUpdated(Attributes);

        console.log(
            `[Category] CATEGORY_UPDATED published for ${Attributes.categoryId}`
        );
    } catch (err) {
        console.error(
            "[Category] Failed to publish CATEGORY_UPDATED",
            err
        );
    }


    return Attributes;
};

const generateCategoryUploadUrl = async (
    fileName,
    contentType
) => {
    return await generateUploadUrl(
        fileName,
        contentType,
        "categories"
    );
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    generateCategoryUploadUrl
};
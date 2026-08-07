const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../utils/s3Client");
const { deleteImageFromS3 } = require('../utils/s3Helper');
const { publishProductCreated, publishProductDeleted } = require('../utils/productPublisher');
const { getCategory } = require("../utils/categoryApi");
const {
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
  BatchGetCommand
} = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../utils/fileHandler');

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

const getAllProducts = async (query) => {
  const { search, category, brand, minPrice, maxPrice, sort, order, page, limit } = query;

  const expressions = [];
  const attrNames = {};
  const attrValues = {};

  if (category) {
    expressions.push('#category = :category');
    attrNames['#category'] = 'category';
    attrValues[':category'] = category;
  }
  if (brand) {
    expressions.push('#brand = :brand');
    attrNames['#brand'] = 'brand';
    attrValues[':brand'] = brand;
  }
  if (minPrice) {
    expressions.push('#price >= :minPrice');
    attrNames['#price'] = 'price';
    attrValues[':minPrice'] = parseFloat(minPrice);
  }
  if (maxPrice) {
    expressions.push('#price <= :maxPrice');
    attrNames['#price'] = 'price';
    attrValues[':maxPrice'] = parseFloat(maxPrice);
  }

  const params = {
    TableName: TABLE_NAME,
    ...(expressions.length && {
      FilterExpression: expressions.join(' AND '),
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    }),
  };

  const { Items = [] } = await docClient.send(new ScanCommand(params));

  let products = Items.map(p => ({
    ...p,
    displayId: p.displayId || generateDisplayId('PRD', p.productId)
  }));

  if (search) {
    const term = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.displayId && p.displayId.toLowerCase().includes(term)) ||
        p.description.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }

  if (sort) {
    switch (sort) {
      case 'priceAsc':
        products.sort((a, b) => a.price - b.price);
        break;

      case 'priceDesc':
        products.sort((a, b) => b.price - a.price);
        break;

      case 'latest':
        products.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;

      case 'oldest':
        products.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;

      case 'nameAsc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'nameDesc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;

      default:
        break;
    }
  }

  const total = products.length;
  const currentPage = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const start = (currentPage - 1) * pageSize;
  const paginated = products.slice(start, start + pageSize);

  return {
    products: paginated,
    meta: { total, page: currentPage, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
  };
};

const getProductById = async (id) => {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { productId: id } }));
  if (!Item) return null;
  return {
    ...Item,
    displayId: Item.displayId || generateDisplayId('PRD', Item.productId)
  };
};

const createProduct = async (data) => {
  console.log("STEP 1 - Start createProduct");

  const category = await getCategory(data.categoryId);
  console.log("STEP 2 - Category validated");

  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  if (category.status !== "ACTIVE") {
    const err = new Error("Category is inactive");
    err.statusCode = 400;
    throw err;
  }

  console.log("STEP 3 - Creating product object");

  const productId = uuidv4();
  const displayId = data.displayId || generateDisplayId('PRD', productId);

  const product = {
    productId,
    displayId,
    name: data.name,
    description: data.description,
    brand: data.brand,
    categoryId: data.categoryId,
    categoryName: category.name,
    price: parseFloat(data.price),
    images: data.images || [],
    specifications: data.specifications || {},
    featured: data.featured || false,
    status: data.status || "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("STEP 4 - Saving to DynamoDB");

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: product,
    })
  );

  console.log("STEP 5 - Saved to DynamoDB");

  console.log("STEP 6 - Publishing SNS");

  await publishProductCreated(product);

  console.log("STEP 7 - SNS Published");

  return product;
};

const getProductsByIds = async (productIds) => {

  if (!Array.isArray(productIds) || productIds.length === 0) {
    const err = new Error("productIds array is required");
    err.statusCode = 400;
    throw err;
  }

  const { Responses } = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: productIds.map((id) => ({
            productId: id,
          })),
        },
      },
    })
  );

  return Responses?.[TABLE_NAME] || [];
};

const updateProduct = async (id, data) => {
  const existing = await getProductById(id);
  if (!existing) return null;

  if (data.images && Array.isArray(data.images)) {

    const oldImages = existing.images || [];
    const newImages = data.images || [];

    const newKeys = newImages.map(image => image.key);

    const removedImages = oldImages.filter(
      image => !newKeys.includes(image.key)
    );

    for (const image of removedImages) {
      try {
        await deleteImageFromS3(image.key);
      } catch (err) {
        console.error(err);
      }
    }
  }

  const immutable = ['productId', 'createdAt'];
  const stockFields = ['stock', 'currentStock', 'availableStock', 'reservedStock', 'quantity'];
  [...immutable, ...stockFields].forEach((key) => delete data[key]);

  if (data.price !== undefined) data.price = parseFloat(data.price);

  // If categoryId changed, resolve the canonical categoryName from category service
  if (data.categoryId) {
    try {
      const category = await getCategory(data.categoryId);
      if (category && category.name) {
        data.categoryName = category.name;
      }
    } catch (err) {
      console.error('[updateProduct] Could not resolve categoryName:', err.message);
    }
  }

  // Strip empty strings, null, and undefined — DynamoDB rejects empty string attribute values
  Object.keys(data).forEach((key) => {
    if (data[key] === null || data[key] === undefined || data[key] === '') {
      delete data[key];
    }
  });

  data.updatedAt = new Date().toISOString();

  const fields = Object.keys(data);
  if (fields.length === 0) return existing;

  const updateExpr = 'SET ' + fields.map((k) => `#${k} = :${k}`).join(', ');
  const attrNames = Object.fromEntries(fields.map((k) => [`#${k}`, k]));
  const attrValues = Object.fromEntries(fields.map((k) => [`:${k}`, data[k]]));

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { productId: id },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW',
    })
  );
  return Attributes;
};

const getFeaturedProducts = async () => {
  const { Items = [] } = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#featured = :featured AND #status = :status',
      ExpressionAttributeNames: {
        '#featured': 'featured',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':featured': true,
        ':status': 'ACTIVE',
      },
    })
  );

  return Items.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
};

const deleteProduct = async (id) => {
  // Step 1: Check if product exists
  const existing = await getProductById(id);

  if (!existing) return null;

  // Step 2: Delete all images from S3
  if (existing.images && existing.images.length > 0) {
    for (const image of existing.images) {
      if (image.key) {
        await deleteImageFromS3(image.key);
      }
    }
  }

  // Step 3: Delete product from DynamoDB
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        productId: id,
      },
    })
  );

  // Publish PRODUCT_DELETED event
  try {
    await publishProductDeleted(existing);

    console.log(
      `[Product] PRODUCT_DELETED published for ${existing.productId}`
    );
  } catch (err) {
    console.error(
      "[Product] Failed to publish PRODUCT_DELETED",
      err
    );
  }

  return existing;
};

const generateUploadUrl = async (fileName, contentType) => {
  const imageId = uuidv4();

  const extension = fileName.split(".").pop();

  const key = `products/${imageId}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: 'image/*'
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 300, // 5 minutes
  });

  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    imageUrl,
    key,
  };
};

const path = require('path');

const generateUploadUrls = async (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('files array is required');
  }

  const uploads = [];

  for (const file of files) {
    const fileName = typeof file === 'string' ? file : (file.fileName || file.name || '');
    const extension = path.extname(fileName);

    const key = `products/${uuidv4()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: 'image/*',
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    uploads.push({
      uploadUrl,
      imageUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
    });
  }

  return {
    images: uploads,
  };
};

const processCategoryEvent = async (message) => {
  switch (message.eventType) {
    case "CATEGORY_UPDATED": {
      const { categoryId, categoryName } = message;

      console.log(
        `[Product] Updating products for category ${categoryId}`
      );

      // Find all products in this category
      const { Items } = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "categoryId = :categoryId",
          ExpressionAttributeValues: {
            ":categoryId": categoryId,
          },
        })
      );

      console.log(
        `[Product] Found ${Items.length} products`
      );

      // Update every product
      for (const product of Items) {
        await docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
              productId: product.productId,
            },
            UpdateExpression:
              "SET categoryName = :name, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":name": categoryName,
              ":updatedAt": new Date().toISOString(),
            },
          })
        );

        console.log(
          `[Product] Updated ${product.productId}`
        );
      }

      break;
    }

    default:
      console.log(
        `[Product] Unknown event ${message.eventType}`
      );
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getFeaturedProducts, generateUploadUrl, generateUploadUrls, processCategoryEvent, getProductsByIds };

import {
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  GetGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

const userPoolId = process.env.COGNITO_USER_POOL_ID || "ap-south-2_AekUQ0VVq";
const region = process.env.AWS_REGION || "ap-south-2";

const client = new CognitoIdentityProviderClient({ region });

async function ensureGroup(groupName, description) {
  try {
    await client.send(new GetGroupCommand({ UserPoolId: userPoolId, GroupName: groupName }));
    console.log(`Group "${groupName}" already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      await client.send(new CreateGroupCommand({
        UserPoolId: userPoolId,
        GroupName: groupName,
        Description: description
      }));
      console.log(`Created group "${groupName}".`);
    } else {
      throw err;
    }
  }
}

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@natcart.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminNatcart2026!";

  // 1. Create Groups
  await ensureGroup("admin", "Admin group with full administrative access");
  await ensureGroup("user", "Standard user group for customers");

  // 2. Create User
  try {
    await client.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: adminEmail }));
    console.log(`User "${adminEmail}" already exists in Cognito.`);
  } catch (err) {
    if (err.name === "UserNotFoundException") {
      await client.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: adminEmail,
        UserAttributes: [
          { Name: "email", Value: adminEmail },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: "System Admin" }
        ],
        MessageAction: "SUPPRESS"
      }));
      console.log(`Created user "${adminEmail}".`);
    } else {
      throw err;
    }
  }

  // 3. Set Permanent Password
  await client.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: adminEmail,
    Password: adminPassword,
    Permanent: true
  }));
  console.log(`Set permanent password for "${adminEmail}".`);

  // 4. Add User to Admin Group
  await client.send(new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    GroupName: "admin",
    Username: adminEmail
  }));
  console.log(`Added "${adminEmail}" to "admin" group successfully.`);
}

createAdminUser().catch((err) => {
  console.error("Error setting up Cognito Admin:", err);
  process.exit(1);
});

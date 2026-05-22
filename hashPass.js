const bcrypt = require("bcryptjs");
 
async function hashPassword() {
  const newPassword = await bcrypt.hash("Password123", 10);
  console.log(newPassword);
}
 
hashPassword();